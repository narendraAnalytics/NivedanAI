import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { rfpJobs, agentRuns } from '@/db/schema'

export async function updateJobStatus(jobId: string, status: string) {
  await db
    .update(rfpJobs)
    .set({ status, updatedAt: new Date() })
    .where(eq(rfpJobs.id, jobId))
}

export async function updateCurrentAgent(jobId: string, agentNum: number) {
  await db
    .update(rfpJobs)
    .set({ currentAgent: agentNum, updatedAt: new Date() })
    .where(eq(rfpJobs.id, jobId))
}

export async function createAgentRun(
  jobId: string,
  agentNumber: number,
  agentName: string,
  modelUsed: string
): Promise<string> {
  const [run] = await db
    .insert(agentRuns)
    .values({
      rfpJobId: jobId,
      agentNumber,
      agentName,
      modelUsed,
      status: 'running',
      startedAt: new Date(),
    })
    .returning({ id: agentRuns.id })
  return run.id
}

export async function completeAgentRun(
  runId: string,
  inputTokens?: number,
  outputTokens?: number,
  durationMs?: number
) {
  await db
    .update(agentRuns)
    .set({
      status: 'completed',
      inputTokens,
      outputTokens,
      durationMs,
      completedAt: new Date(),
    })
    .where(eq(agentRuns.id, runId))
}

export async function failAgentRun(runId: string, errorMessage: string) {
  await db
    .update(agentRuns)
    .set({
      status: 'failed',
      errorMessage,
      completedAt: new Date(),
    })
    .where(eq(agentRuns.id, runId))
}
