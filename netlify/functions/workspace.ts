import { handleWorkspace } from '../../api/workspace.ts'

export const config = { path: '/api/*' }

export default function workspace(request: Request) {
  return handleWorkspace(request, { scheduledResearch: true })
}
