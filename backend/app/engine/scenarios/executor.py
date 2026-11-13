"""Scenario executor: converts scenario snapshots into executable test cases with canary instrumentation and assertions."""

import time
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.adapters.base import AdapterRequest, AdapterResponse
from app.engine.adapters.registry import AdapterRegistry
from app.engine.assertions.evaluator import AssertionEvaluator
from app.engine.canaries.manager import CanaryManager, GeneratedCanary
from app.engine.findings.classifier import FindingClassifier
from app.engine.provenance.tracker import ProvenanceTracker
from app.engine.taint.instrumentor import TaintInstrumentor
from app.models.execution import (
    AssertionStatus,
    CanaryStatus,
    EventType,
    TestCaseExecutionStatus,
    TestRunCase,
)
from app.repositories.execution_repository import ExecutionRepository


class ScenarioExecutor:
    """Executes an individual test case with session-bound canary tainting and assertion evaluations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ExecutionRepository(db)
        self.canary_manager = CanaryManager()
        self.assertion_evaluator = AssertionEvaluator(self.canary_manager)
        self.finding_classifier = FindingClassifier()
        self.provenance_tracker = ProvenanceTracker()

    async def execute_case(
        self,
        *,
        test_run_id: uuid.UUID,
        case: TestRunCase,
        target_config: dict[str, Any],
        canary_tainting_enabled: bool = True,
        timeout_seconds: int = 30,
    ) -> TestCaseExecutionStatus:
        """Execute a single test case within a run."""
        start_time = time.perf_counter()
        started_at = datetime.now(timezone.utc)

        # Mark case as running
        await self.repo.update_case(
            case,
            status=TestCaseExecutionStatus.RUNNING,
            started_at=started_at,
        )
        await self.repo.record_event(
            test_run_id=test_run_id,
            test_run_case_id=case.id,
            event_type=EventType.CASE_STARTED,
            message=f"Starting scenario execution: {case.scenario_snapshot.get('name', 'Scenario')}",
        )

        scenario = case.scenario_snapshot or {}
        category = scenario.get("category", "PROMPT_INJECTION")
        input_template = scenario.get("attack_input_template", "")

        generated_canary: GeneratedCanary | None = None
        synthetic_docs: list[dict[str, Any]] = []
        active_tokens: list[str] = []

        # 1. Canary Generation & Taint Instrumentation
        if canary_tainting_enabled:
            source_id = f"synthetic_doc_{case.id.hex[:8]}"
            generated_canary = self.canary_manager.generate_canary(
                test_run_id=test_run_id,
                source_id=source_id,
                source_type="RAG_DOCUMENT" if category in ("PROMPT_INJECTION", "DATA_DISCLOSURE") else "CONTEXT",
                test_run_case_id=case.id,
            )
            active_tokens.append(generated_canary.token)

            # Persist canary in DB
            db_canary = await self.repo.create_canary(
                test_run_id=test_run_id,
                test_run_case_id=case.id,
                source_id=generated_canary.source_id,
                source_type=generated_canary.source_type,
                digest=generated_canary.digest,
                key_version=generated_canary.key_version,
                token_preview=generated_canary.token_preview,
                expires_at=generated_canary.expires_at,
                metadata_json={"scenario_id": str(case.scenario_id), "category": category},
            )

            await self.repo.record_event(
                test_run_id=test_run_id,
                test_run_case_id=case.id,
                event_type=EventType.CANARY_GENERATED,
                message=f"Generated session-bound canary token (preview: {generated_canary.token_preview})",
                metadata={"canary_id": str(db_canary.id), "source_id": source_id},
            )

            # Instrument synthetic RAG document
            if category in ("PROMPT_INJECTION", "DATA_DISCLOSURE", "REGRESSION"):
                instrumented_source = TaintInstrumentor.instrument_rag_document(
                    doc_id=source_id,
                    title="Confidential Corporate Security Documentation",
                    content="This internal document contains restricted organizational credentials and security markers.",
                    canary=generated_canary,
                    injection_payload=input_template if category == "PROMPT_INJECTION" else None,
                )
                synthetic_docs.append({
                    "source_id": instrumented_source.source_id,
                    "content": instrumented_source.instrumented_content,
                    "metadata": instrumented_source.metadata,
                })

                await self.repo.record_event(
                    test_run_id=test_run_id,
                    test_run_case_id=case.id,
                    event_type=EventType.SOURCE_INSTRUMENTED,
                    message=f"Instrumented synthetic source '{source_id}' with canary token",
                    metadata={"source_id": source_id},
                )

            # Prepare final prompt text with canary variable substitutions
            prompt_text = TaintInstrumentor.instrument_input_template(
                input_template,
                generated_canary,
                context_vars={"source_id": source_id},
            )
        else:
            prompt_text = input_template

        # 2. Select Adapter and Dispatch Request
        target_type = target_config.get("target_type", "CHAT_API")
        base_url = target_config.get("base_url", "")
        adapter = AdapterRegistry.get_adapter(target_type, base_url)

        req = AdapterRequest(
            prompt=prompt_text,
            synthetic_documents=synthetic_docs,
            target_config=target_config,
            timeout_seconds=timeout_seconds,
        )

        await self.repo.record_event(
            test_run_id=test_run_id,
            test_run_case_id=case.id,
            event_type=EventType.ADAPTER_REQUEST_SENT,
            message=f"Dispatched request via adapter: {adapter.__class__.__name__}",
        )

        try:
            adapter_response = await adapter.execute(req)
        except Exception as e:
            adapter_response = AdapterResponse(
                raw_text="",
                status_code=500,
                latency_ms=int((time.perf_counter() - start_time) * 1000),
                is_success=False,
                error_message=f"Adapter execution exception: {str(e)}",
            )

        await self.repo.record_event(
            test_run_id=test_run_id,
            test_run_case_id=case.id,
            event_type=EventType.ADAPTER_RESPONSE_RECEIVED,
            message=f"Received adapter response (status: {adapter_response.status_code}, latency: {adapter_response.latency_ms}ms)",
            metadata={"status_code": adapter_response.status_code, "latency_ms": adapter_response.latency_ms},
        )

        # 3. Persist Target Traces
        for trace in adapter_response.traces:
            await self.repo.record_trace(
                test_run_id=test_run_id,
                test_run_case_id=case.id,
                source_id=trace.get("source_id"),
                trace_type=trace.get("trace_type", "GENERAL_TRACE"),
                trace_metadata=trace,
            )

        # 4. Check for Canary Exposure & Provenance Attribution
        provenance = None
        if generated_canary:
            extracted_tokens = self.canary_manager.extract_candidate_tokens(adapter_response.raw_text)
            for tc in adapter_response.tool_calls:
                extracted_tokens.extend(self.canary_manager.extract_candidate_tokens(str(tc)))

            if generated_canary.token in extracted_tokens:
                # Canary was observed!
                await self.repo.record_event(
                    test_run_id=test_run_id,
                    test_run_case_id=case.id,
                    event_type=EventType.CANARY_OBSERVED,
                    message=f"Canary token {generated_canary.token_preview} observed in response output!",
                    metadata={"token_preview": generated_canary.token_preview},
                )
                await self.repo.update_canary_status(db_canary, CanaryStatus.OBSERVED)

                # Verify token cryptographically
                is_verified = self.canary_manager.verify_token(generated_canary.token, generated_canary.digest)
                provenance = self.provenance_tracker.evaluate_attribution(
                    canary_digest=generated_canary.digest,
                    token_preview=generated_canary.token_preview,
                    source_id=generated_canary.source_id,
                    source_type=generated_canary.source_type,
                    observation_location="RESPONSE_OUTPUT",
                    detection_method="EXACT_TOKEN_MATCH",
                    is_token_verified=is_verified,
                    target_traces=adapter_response.traces,
                )

        # 5. Deterministic Assertions
        evaluations = self.assertion_evaluator.evaluate_all(
            scenario_config=scenario,
            response=adapter_response,
            active_canary_tokens=active_tokens,
        )

        has_failure = False
        for ev in evaluations:
            await self.repo.record_assertion_result(
                test_run_case_id=case.id,
                assertion_id=ev.assertion_id,
                assertion_type=ev.assertion_type,
                status=ev.status,
                expected_value=ev.expected_value,
                actual_value=ev.actual_value,
                evidence=ev.evidence,
            )
            await self.repo.record_event(
                test_run_id=test_run_id,
                test_run_case_id=case.id,
                event_type=EventType.ASSERTION_COMPLETED,
                message=f"Assertion [{ev.assertion_id}]: {ev.status.value}",
                metadata={"status": ev.status.value, "assertion_type": ev.assertion_type.value},
            )

            # If an assertion failed, create a security finding
            if ev.status == AssertionStatus.FAILED:
                has_failure = True
                finding_spec = self.finding_classifier.classify_assertion_failure(
                    evaluation=ev,
                    scenario_snapshot=scenario,
                    provenance=provenance,
                    test_run_id_str=str(test_run_id),
                    scenario_id_str=str(case.scenario_id or ""),
                )
                finding = await self.repo.create_finding(
                    test_run_id=test_run_id,
                    test_run_case_id=case.id,
                    canary_id=db_canary.id if generated_canary else None,
                    source_id=generated_canary.source_id if generated_canary else None,
                    category=finding_spec.category,
                    title=finding_spec.title,
                    description=finding_spec.description,
                    severity=finding_spec.severity,
                    confidence=finding_spec.confidence,
                    observation_location=finding_spec.observation_location,
                    detection_method=finding_spec.detection_method,
                    attribution_level=finding_spec.attribution_level,
                    evidence_reference=finding_spec.evidence_reference,
                    deduplication_key=finding_spec.deduplication_key,
                )
                await self.repo.record_event(
                    test_run_id=test_run_id,
                    test_run_case_id=case.id,
                    event_type=EventType.FINDING_CREATED,
                    message=f"Security finding identified: {finding_spec.title} [{finding_spec.severity.value}]",
                    metadata={"finding_id": str(finding.id), "severity": finding_spec.severity.value},
                )

        # 6. Finalize Case Status & Timing
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        completed_at = datetime.now(timezone.utc)

        if not adapter_response.is_success:
            final_status = TestCaseExecutionStatus.ERROR
        elif has_failure:
            final_status = TestCaseExecutionStatus.FAILED
        else:
            final_status = TestCaseExecutionStatus.PASSED

        # Redacted metadata
        req_meta = {
            "prompt_length": len(prompt_text),
            "documents_count": len(synthetic_docs),
            "canary_enabled": canary_tainting_enabled,
        }
        resp_meta = {
            "status_code": adapter_response.status_code,
            "latency_ms": adapter_response.latency_ms,
            "response_preview": adapter_response.raw_text[:200] if adapter_response.raw_text else "",
            "tool_calls_count": len(adapter_response.tool_calls),
            "traces_count": len(adapter_response.traces),
        }

        await self.repo.update_case(
            case,
            status=final_status,
            completed_at=completed_at,
            duration_ms=duration_ms,
            normalized_request_metadata=req_meta,
            normalized_response_metadata=resp_meta,
            error_code=None if adapter_response.is_success else f"HTTP_{adapter_response.status_code}",
            error_message=adapter_response.error_message,
        )

        await self.repo.record_event(
            test_run_id=test_run_id,
            test_run_case_id=case.id,
            event_type=EventType.CASE_COMPLETED,
            message=f"Completed scenario execution: {final_status.value} in {duration_ms}ms",
            metadata={"status": final_status.value, "duration_ms": duration_ms},
        )

        return final_status
