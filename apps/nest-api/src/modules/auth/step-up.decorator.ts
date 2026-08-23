import { SetMetadata } from '@nestjs/common';

import type { StepUpAction } from './dto/auth.dto';

export const STEP_UP_ACTION_KEY = 'stepUpAction';

/** Declares which security action a route requires step-up authorization for. */
export const RequireStepUp = (action: StepUpAction) => SetMetadata(STEP_UP_ACTION_KEY, action);
