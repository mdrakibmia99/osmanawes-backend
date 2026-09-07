import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { openaiService } from "./openai.service";
const AIScriptGenerator = catchAsync(async (req: Request, res: Response) => {


    const result = await openaiService.AIScriptGenerator(req.user.userId,req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'script generated successfully',
        data: result,
    });
});

export const openaiController = {
    AIScriptGenerator,
};