using System.Text;
using System.Text.Json;
using QuizMasterPro.API.DTOs.Quiz;

namespace QuizMasterPro.API.Services;

public class AiService
{
    private readonly IConfiguration _cfg;
    private readonly HttpClient _http;

    public AiService(IConfiguration cfg, IHttpClientFactory factory)
    {
        _cfg = cfg;
        _http = factory.CreateClient();
    }

    public async Task<List<CreateQuestionDto>> GenerateAsync(string topic, string difficulty, int count, string type)
    {
        var apiKey = _cfg["Gemini:ApiKey"] ?? throw new InvalidOperationException("Gemini:ApiKey not configured");

        var prompt = $$"""
            Generate {{count}} {{difficulty}}-difficulty {{type}} questions about "{{topic}}".
            Return ONLY a valid JSON array with no markdown fences, no extra text:
            [
              {
                "text": "question here",
                "type": "{{type}}",
                "options": [
                  {"text": "Option A", "isCorrect": false},
                  {"text": "Option B", "isCorrect": true},
                  {"text": "Option C", "isCorrect": false},
                  {"text": "Option D", "isCorrect": false}
                ],
                "explanation": "correct explanation",
                "difficulty": "{{difficulty}}",
                "marks": 1,
                "negativeMark": 0
              }
            ]
            For true_false: 2 options (True/False) only. Exactly one isCorrect per question.
            """;

        var body = new
        {
            contents = new[] { new { parts = new[] { new { text = prompt } } } },
            generationConfig = new { temperature = 0.7, maxOutputTokens = 4096 }
        };

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}";
        var resp = await _http.PostAsync(url, new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"));
        resp.EnsureSuccessStatusCode();

        var json = await resp.Content.ReadAsStringAsync();
        var root = JsonDocument.Parse(json).RootElement;
        var text = root.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString() ?? "[]";
        text = text.Replace("```json", "").Replace("```", "").Trim();

        var result = JsonSerializer.Deserialize<List<CreateQuestionDto>>(text, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
        result.ForEach(q => { q.Type = type; q.Difficulty = difficulty; });
        return result;
    }
}
