using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizMasterPro.API.DTOs.Quiz;
using QuizMasterPro.API.Services;

namespace QuizMasterPro.API.Controllers;

[Authorize(Roles = "faculty"), Route("api/ai")]
public class AiController : BaseController
{
    private readonly AiService _ai;
    private readonly QuestionService _qSvc;
    public AiController(AiService ai, QuestionService qSvc) { _ai = ai; _qSvc = qSvc; }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] AIGenerateDto dto)
    {
        try
        {
            var questions = await _ai.GenerateAsync(dto.Topic, dto.Difficulty, dto.Count, dto.QuestionType);
            if (dto.QuizId > 0)
            {
                var saved = await _qSvc.BulkCreateAsync(dto.QuizId, questions, UserId);
                return Ok(new { Success = true, Message = $"{saved.Count} AI questions added to quiz", Data = saved });
            }
            return Ok(new { Success = true, Data = questions });
        }
        catch (Exception ex) { return StatusCode(500, new { Success = false, Message = ex.Message }); }
    }
}
