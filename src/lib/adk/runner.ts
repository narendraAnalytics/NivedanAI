import { Runner } from '@google/adk'
import { sessionService } from './session'
import { memoryService } from './memory'

export { sessionService, memoryService }

export function createRunner(agent: any) {
  return new Runner({
    agent,
    appName: 'nivedanai',
    sessionService,
    memoryService,
  })
}
