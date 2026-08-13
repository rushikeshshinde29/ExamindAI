using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizMasterPro.API.Data;
using QuizMasterPro.API.DTOs.Quiz;
using QuizMasterPro.API.Services;

namespace QuizMasterPro.API.Controllers;

[Authorize, Route("api/quizzes")]
public class QuizzesController : BaseController
{
    private readonly QuizService _svc;
    private readonly AppDbContext _db;
    public QuizzesController(QuizService svc, AppDbContext db) { _svc = svc; _db = db; }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 20,
        [FromQuery] string? subject = null, [FromQuery] string? difficulty = null, [FromQuery] string? search = null)
    {
        var (data, total) = await _svc.GetAllAsync(UserId, UserRole, page, limit, subject, difficulty, search);
        return Ok(new { Success = true, Data = data, Total = total, Page = page, Pages = (int)Math.Ceiling((double)total / limit) });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var q = await _svc.GetByIdAsync(id, UserRole);
        return q != null ? Ok(new { Success = true, Data = q }) : NotFound(new { Success = false, Message = "Quiz not found" });
    }

    [Authorize(Roles = "faculty"), HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateQuizDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var q = await _svc.CreateAsync(dto, UserId);
        return StatusCode(201, new { Success = true, Message = "Quiz created", Data = q });
    }

    [Authorize(Roles = "faculty"), HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateQuizDto dto)
    {
        var q = await _svc.UpdateAsync(id, dto, UserId);
        return q != null ? Ok(new { Success = true, Data = q }) : NotFound(new { Success = false, Message = "Quiz not found" });
    }

    [Authorize(Roles = "faculty"), HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _svc.DeleteAsync(id, UserId);
        return ok ? Ok(new { Success = true, Message = "Deleted" }) : NotFound(new { Success = false, Message = "Not found" });
    }

    [Authorize(Roles = "faculty"), HttpPatch("{id}/publish")]
    public async Task<IActionResult> Publish(int id)
    {
        var (ok, msg, data) = await _svc.TogglePublishAsync(id, UserId);
        return ok ? Ok(new { Success = true, Message = msg, Data = data }) : BadRequest(new { Success = false, Message = msg });
    }

    [Authorize(Roles = "faculty,admin"), HttpGet("{id}/results")]
    public async Task<IActionResult> Results(int id)
    {
        dynamic results = await _svc.GetResultsAsync(id);
        return Ok(new { Success = true, results.Data, results.Stats });
    }

    [HttpGet("leaderboard/{quizId}")]
    public async Task<IActionResult> Leaderboard(int quizId)
    {
        var data = await _db.Attempts
            .Include(a => a.Student)
            .Where(a => a.QuizId == quizId && a.Status == "completed")
            .OrderByDescending(a => a.Percentage).ThenBy(a => a.TimeTaken)
            .Take(50)
            .Select(a => new { a.Rank, a.StudentId, Name = a.Student.Name, Dept = a.Student.Department, a.Percentage, a.ObtainedMarks, a.TimeTaken, a.CreatedAt })
            .ToListAsync();
        return Ok(new { Success = true, Data = data });
    }
}
