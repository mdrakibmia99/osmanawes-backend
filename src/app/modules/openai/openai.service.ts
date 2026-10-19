import { generatePracticeScript, IScriptGeneratorPayload } from "../../utils/AI/scriptGenerator";

const AIScriptGenerator = async (payload: IScriptGeneratorPayload) => {
    const formattedText = await generatePracticeScript(payload);
    return formattedText;
};

export const openaiService = {
    AIScriptGenerator,
};