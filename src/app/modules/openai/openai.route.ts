import { Router } from "express";
import validateRequest from "../../middleware/validateRequest";
import { openaiValidations } from "./openai.validation";
import { openaiController } from "./openai.controller";
import { USER_ROLE } from "../user/user.constants";
import auth from "../../middleware/auth";

export const openAiRoutes = Router();

openAiRoutes.post('/script-generator', auth(USER_ROLE.USER), validateRequest(openaiValidations.generatePracticeScriptValidationSchema), openaiController.AIScriptGenerator);