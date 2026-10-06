from abc import ABC, abstractmethod
from typing import List, Dict, Any, Callable, Optional
import asyncio
import logging

logger = logging.getLogger(__name__)

class WorkflowStep(ABC):
    """Abstract base class for an ADK-style agent or pipeline step."""
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the step, mutating or returning additions to context."""
        pass

class SequentialWorkflow(WorkflowStep):
    """Executes a chain of workflow steps in strict sequential order."""
    def __init__(self, name: str, steps: List[WorkflowStep]):
        super().__init__(name)
        self.steps = steps

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        for step in self.steps:
            logger.info(f"[{self.name}] Running sequential step: {step.name}")
            step_output = await step.execute(context)
            if step_output and isinstance(step_output, dict):
                context.update(step_output)
        return context

class ParallelWorkflow(WorkflowStep):
    """Executes multiple workflow steps concurrently."""
    def __init__(self, name: str, steps: List[WorkflowStep]):
        super().__init__(name)
        self.steps = steps

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"[{self.name}] Executing {len(self.steps)} steps in parallel")
        tasks = [step.execute(dict(context)) for step in self.steps]
        results = await asyncio.gather(*tasks, return_exceptions=False)
        for res in results:
            if res and isinstance(res, dict):
                context.update(res)
        return context

class LoopWorkflow(WorkflowStep):
    """Executes a step repeatedly in a critic/refinement loop until a condition is met."""
    def __init__(
        self,
        name: str,
        step: WorkflowStep,
        condition: Callable[[Dict[str, Any]], bool],
        max_iterations: int = 3
    ):
        super().__init__(name)
        self.step = step
        self.condition = condition
        self.max_iterations = max_iterations

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        iterations = 0
        while iterations < self.max_iterations:
            iterations += 1
            logger.info(f"[{self.name}] Loop iteration {iterations}/{self.max_iterations}")
            step_output = await self.step.execute(context)
            if step_output and isinstance(step_output, dict):
                context.update(step_output)
            
            # Check condition
            try:
                if self.condition(context):
                    logger.info(f"[{self.name}] Loop condition satisfied after {iterations} iterations.")
                    break
            except Exception as e:
                logger.warning(f"[{self.name}] Condition evaluation error: {e}")
                break
        return context
