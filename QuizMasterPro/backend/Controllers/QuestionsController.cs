using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizMasterPro.API.DTOs.Quiz;
using QuizMasterPro.API.Services;

namespace QuizMasterPro.API.Controllers;

[Authorize, Route("api/questions")]
public class QuestionsController : BaseController
{
    private readonly QuestionService _svc;
    public QuestionsController(QuestionService svc) { _svc = svc; }

    [HttpGet("quiz/{quizId}")]
    public async Task<IActionResult> GetByQuiz(int quizId)
    {
        bool hide = UserRole == "student";
        return Ok(new { Success = true, Data = await _svc.GetByQuizAsync(quizId, hide) });
    }

    [Authorize(Roles = "faculty"), HttpPost("{quizId}")]
    public async Task<IActionResult> Create(int quizId, [FromBody] CreateQuestionDto dto)
    {
        var q = await _svc.CreateAsync(quizId, dto, UserId);
        return StatusCode(201, new { Success = true, Data = q });
    }

    [Authorize(Roles = "faculty"), HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateQuestionDto dto)
    {
        var q = await _svc.UpdateAsync(id, dto, UserId);
        return q != null ? Ok(new { Success = true, Data = q }) : NotFound();
    }

    [Authorize(Roles = "faculty"), HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            return await _svc.DeleteAsync(id, UserId) ? Ok(new { Success = true }) : NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Success = false, Message = ex.Message });
        }
    }

    [Authorize(Roles = "faculty"), HttpPost("bulk/{quizId}")]
    public async Task<IActionResult> Bulk(int quizId, [FromBody] List<CreateQuestionDto> dtos)
    {
        try
        {
            var result = await _svc.BulkCreateAsync(quizId, dtos, UserId, isAi: false, deleteExisting: true);
            return StatusCode(201, new { Success = true, Data = result });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Success = false, Message = ex.Message });
        }
    }
}
