export const checkIsChatGPTEnabled = () => {
  return !!process.env.CHATGPT_API_KEY;
};
