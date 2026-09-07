import { generatePracticeScript, IScriptGeneratorPayload } from "../../utils/AI/scriptGenerator";

const AIScriptGenerator = async (userId:string,payload: IScriptGeneratorPayload) => {
    const formattedText = await generatePracticeScript(userId,payload);
    return formattedText;
};

export const openaiService = {
    AIScriptGenerator,
};