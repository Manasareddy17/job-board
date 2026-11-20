import { ActionType, Modules } from '../core/enums/value.enum';

// Standard reply for create / update / delete, same shape as the company services
export function buildResponse(
  entity: Modules,
  id: string | number,
  action: ActionType,
) {
  return {
    id: String(id),
    message: `Successfully ${action} ${entity} - ${id}`,
  };
}
