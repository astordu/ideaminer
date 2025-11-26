import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with DeepSeek configuration
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text, title, subreddit, comments } = await request.json();

    if (!text || !title) {
      return NextResponse.json(
        { error: 'Missing text or title' },
        { status: 400 }
      );
    }

    const prompt = `
      作为一个专业的创业点子分析师，请分析以下来自 Reddit ${subreddit || ''} 的用户抱怨/痛点，并构思一个有潜力的 AI 产品解决方案。
      
      帖子标题: "${title}"
      帖子内容: "${text}"
      用户评论: "${comments || '无评论'}"
      
      任务：
      1. 总结用户的核心痛点。
      2. 根据痛点构思一个 AI 产品解决方案。
      3. 给出可行性评分 (0-100)。
      
      请严格以 JSON 格式返回分析结果，不要包含任何 markdown 格式或其他文本。JSON 结构如下：
      {
        "product_name": "简短有力的产品名称",
        "tagline": "一句话标语",
        "viability_score": 0-100之间的数字,
        "core_pain_point": "核心痛点描述",
        "solution": "详细的产品解决方案描述",
        "monetization": "商业模式建议"
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "deepseek-chat",
      temperature: 1.3, // Slightly creative
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    
    if (!content) {
      throw new Error("No content received from AI");
    }

    const analysis = JSON.parse(content);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing idea:', error);
    return NextResponse.json(
      { error: 'Failed to analyze idea' },
      { status: 500 }
    );
  }
}
