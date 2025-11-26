'use client';

import React, { useState } from 'react';
import { Search, ThumbsUp, MessageSquare, Lightbulb, Zap, ExternalLink, RefreshCw, Filter, BrainCircuit, AlertTriangle, ArrowRight } from 'lucide-react';

interface RedditPost {
  id: string;
  title: string;
  author: string;
  ups: number;
  num_comments: number;
  permalink: string;
  created_utc: number;
  subreddit: string;
  selftext: string;
  comments_summary: string;
  ai_analysis?: AIAnalysis;
}

interface AIAnalysis {
  product_name: string;
  tagline: string;
  viability_score: number;
  core_pain_point: string;
  solution: string;
  monetization: string;
}

const RedditIdeaMiner = () => {
  // 状态管理
  const [keyword, setKeyword] = useState('"I hate"');
  const [minUps, setMinUps] = useState(5);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState<RedditPost[]>([]);

  // 搜索过程
  const handleSearch = async () => {
    setIsSearching(true);
    setResults([]);
    
    try {
      // 步骤 1: 搜索 Reddit (调用我们的 API)
      setProgress(`正在搜索 Reddit 中包含 ${keyword} 的内容 (24h内)...`);
      const searchResponse = await fetch(`/api/search?q=${encodeURIComponent(keyword)}&min_ups=${minUps}`);
      if (!searchResponse.ok) throw new Error('Search failed');
      const searchResults: RedditPost[] = await searchResponse.json();
      
      if (searchResults.length === 0) {
        setProgress('未找到相关内容，请尝试其他关键词。');
        setIsSearching(false);
        return;
      }

      // 步骤 2: 过滤数据 (已经在 API 端完成，这里只是展示进度)
      setProgress(`发现 ${searchResults.length} 个潜在话题，正在进行 AI 分析...`);
      
      // 步骤 3 & 4: AI 分析 (逐个或批量分析)
      // 为了演示效果，我们逐个分析并显示结果
      const analyzedResults: RedditPost[] = [];
      
      for (const post of searchResults) {
        setProgress(`正在分析话题: "${post.title.substring(0, 30)}..."`);
        
        try {
          const analyzeResponse = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: post.title,
              text: post.selftext,
              subreddit: post.subreddit,
              comments: post.comments_summary
            })
          });
          
          if (analyzeResponse.ok) {
            const analysis: AIAnalysis = await analyzeResponse.json();
            analyzedResults.push({ ...post, ai_analysis: analysis });
            // 实时更新结果，让用户看到进度
            setResults([...analyzedResults]); 
          }
        } catch (err) {
          console.error('Analysis failed for post:', post.id, err);
        }
      }

      setProgress(`分析完成！发现 ${analyzedResults.length} 个高价值 AI 产品机会。`);
    } catch (error) {
      console.error('Search flow failed:', error);
      setProgress('发生错误，请重试。');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              PainPoint Miner
            </h1>
            <span className="hidden sm:inline-block text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full border border-slate-200">
              AI 创意挖掘器
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              System Status: Online
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 控制面板 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            
            <div className="md:col-span-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                挖掘关键词 (Keywords)
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                最小点赞数 (Min Upvotes)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={minUps}
                  onChange={(e) => setMinUps(parseInt(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
                <Filter className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              </div>
            </div>

            <div className="md:col-span-4">
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className={`w-full py-3 px-6 rounded-lg flex items-center justify-center gap-2 font-medium text-white transition-all shadow-md hover:shadow-lg
                  ${isSearching ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 active:scale-95'}`}
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    挖掘中...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    开始挖掘痛点
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 状态日志 */}
          {(isSearching || progress) && (
            <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-200 flex items-start gap-3">
               <div className="mt-1">
                 {isSearching ? (
                   <div className="w-3 h-3 bg-indigo-500 rounded-full animate-ping"></div>
                 ) : (
                   <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                 )}
               </div>
               <div className="font-mono text-sm text-slate-600">
                 {progress}
               </div>
            </div>
          )}
        </div>

        {/* 结果列表 */}
        <div className="space-y-6">
          {results.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">挖掘结果</h2>
              <span className="text-sm text-slate-500">AI 实时分析生成</span>
            </div>
          )}

          {results.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* 左侧：Reddit 原帖 (Context) */}
                <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded uppercase">
                      Reddit / {item.subreddit}
                    </span>
                    <span className="text-xs text-slate-400">
                      {Math.floor((Date.now() / 1000 - item.created_utc) / 3600)} 小时前
                    </span>
                  </div>
                  
                  <a href={`https://reddit.com${item.permalink}`} target="_blank" rel="noreferrer" className="group">
                    <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors flex items-start gap-2">
                      {item.title}
                      <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 mt-1 transition-opacity" />
                    </h3>
                  </a>

                  <p className="text-sm text-slate-600 mb-4 line-clamp-4 leading-relaxed">
                    "{item.selftext}"
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200">
                      <ThumbsUp className="h-3 w-3 text-orange-500" />
                      {item.ups} Ups
                    </div>
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200">
                      <MessageSquare className="h-3 w-3 text-blue-500" />
                      {item.num_comments} Comments
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">社区声音 (Raw Comments)</p>
                    <div className="text-xs text-slate-600 bg-slate-100 p-3 rounded italic border-l-2 border-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                      "{item.comments_summary}"
                    </div>
                  </div>
                </div>

                {/* 右侧：AI 分析 (Solution) */}
                <div className="lg:col-span-7 p-6 relative overflow-hidden">
                  {item.ai_analysis ? (
                    <>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 z-0"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            <h4 className="font-bold text-indigo-900">AI 产品洞察</h4>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                            <Zap className="h-3 w-3 fill-current" />
                            可行性得分: {item.ai_analysis.viability_score}/100
                          </div>
                        </div>

                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-slate-800 mb-1">
                            {item.ai_analysis.product_name}
                          </h3>
                          <p className="text-sm text-indigo-600 font-medium">
                            {item.ai_analysis.tagline}
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">核心痛点</span>
                            <p className="text-sm text-slate-700 mt-1">
                              {item.ai_analysis.core_pain_point}
                            </p>
                          </div>

                          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                              <BrainCircuit className="h-3 w-3" />
                              解决方案逻辑
                            </span>
                            <p className="text-sm text-slate-800 mt-2 leading-relaxed">
                              {item.ai_analysis.solution}
                            </p>
                          </div>

                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">商业模式建议</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              <p className="text-sm text-slate-700 font-medium">
                                {item.ai_analysis.monetization}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-pulse">
                      <BrainCircuit className="h-12 w-12 mb-4 opacity-50" />
                      <p>AI 正在分析痛点并生成方案...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 底部提示 */}
          {results.length > 0 && (
            <div className="text-center pt-8 pb-12">
               <button className="text-slate-500 hover:text-indigo-600 text-sm font-medium flex items-center justify-center gap-1 mx-auto transition-colors">
                 查看完整分析报告 <ArrowRight className="h-4 w-4" />
               </button>
            </div>
          )}

          {/* 空状态 */}
          {!isSearching && results.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">准备就绪</h3>
              <p className="text-slate-500 mt-1 max-w-md mx-auto">
                输入关键词（如 "I hate", "It's difficult", "Why is there no app for"），让 AI 为你挖掘下一个独角兽产品的灵感。
              </p>
            </div>
          )}
        </div>
      </main>

      {/* 注意事项弹窗 */}
      <div className="fixed bottom-4 right-4 max-w-sm bg-slate-900 text-slate-300 p-4 rounded-lg shadow-2xl text-xs border border-slate-700 opacity-90 hover:opacity-100 transition-opacity">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p>
            <span className="font-bold text-white">注意：</span> 
            DeepSeek API 已集成。本演示使用 DeepSeek V3/R1 进行分析。
          </p>
        </div>
      </div>
    </div>
  );
};

export default RedditIdeaMiner;
