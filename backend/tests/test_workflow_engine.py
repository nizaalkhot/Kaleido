import pytest
from backend.agents.workflow_engine import (
    WorkflowStep,
    SequentialWorkflow,
    ParallelWorkflow,
    LoopWorkflow
)

class AddStep(WorkflowStep):
    def __init__(self, key: str, value: int):
        super().__init__(f"Add_{key}")
        self.key = key
        self.value = value

    async def execute(self, context: dict) -> dict:
        context[self.key] = context.get(self.key, 0) + self.value
        return context

@pytest.mark.asyncio
async def test_sequential_workflow():
    step1 = AddStep("counter", 1)
    step2 = AddStep("counter", 2)
    seq = SequentialWorkflow("TestSeq", [step1, step2])
    
    ctx = await seq.execute({})
    assert ctx["counter"] == 3

@pytest.mark.asyncio
async def test_parallel_workflow():
    step1 = AddStep("val_a", 10)
    step2 = AddStep("val_b", 20)
    par = ParallelWorkflow("TestPar", [step1, step2])
    
    ctx = await par.execute({})
    assert ctx["val_a"] == 10
    assert ctx["val_b"] == 20

@pytest.mark.asyncio
async def test_loop_workflow():
    step = AddStep("counter", 1)
    # Loop until counter reaches at least 3
    loop = LoopWorkflow("TestLoop", step, condition=lambda ctx: ctx.get("counter", 0) >= 3, max_iterations=5)
    
    ctx = await loop.execute({})
    assert ctx["counter"] == 3
