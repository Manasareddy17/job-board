import { ActionType, Modules } from '../core/enums/value.enum';
import { buildResponse } from './response-messages.util';

describe('buildResponse', () => {
  it.each([
    [ActionType.Created, 'Successfully Created Job - 5'],
    [ActionType.Updated, 'Successfully Updated Job - 5'],
    [ActionType.Deleted, 'Successfully Deleted Job - 5'],
  ])('builds the %s message', (action, message) => {
    expect(buildResponse(Modules.Job, 5, action)).toEqual({ id: '5', message });
  });

  // The proto field is a string, so a numeric id must be sent as text
  it('returns the id as a string', () => {
    expect(typeof buildResponse(Modules.Job, 12, ActionType.Created).id).toBe('string');
  });
});
