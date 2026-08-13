using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizMasterPro.API.DTOs.Attempt;
using QuizMasterPro.API.Services;

namespace QuizMasterPro.API.Controllers;

[Authorize, Route("api/attempts")]
public class AttemptsController : BaseController
{
    private readonly AttemptService _svc;
    public AttemptsController(AttemptService svc) { _svc = svc; }

    [Authorize(Roles = "student"), HttpPost("start")]
    public async Task<IActionResult> Start([FromBody] StartAttemptDto dto)
    {
        var ua = Request.Headers.UserAgent.ToString();
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "";
        var (ok, msg, data) = await _svc.StartAsync(UserId, dto, ua, ip);
        return ok ? Ok(new { Success = true, Message = msg, Data = data }) : BadRequest(new { Success = false, Message = msg });
    }

    [Authorize(Roles = "student"), HttpPost("{id}/submit")]
    public async Task<IActionResult> Submit(int id, [FromBody] SubmitAttemptDto dto)
    {
        var (ok, msg, data) = await _svc.SubmitAsync(id, UserId, dto);
        return ok ? Ok(new { Success = true, Message = msg, Data = data }) : BadRequest(new { Success = false, Message = msg });
    }

    [Authorize(Roles = "student"), HttpPost("{id}/anticheat")]
    public async Task<IActionResult> AntiCheat(int id, [FromBody] AntiCheatEventDto dto)
    {
        var (ok, data) = await _svc.LogAntiCheatAsync(id, UserId, dto);
        return ok ? Ok(new { Success = true, Data = data }) : NotFound();
    }

    [Authorize(Roles = "student"), HttpGet("my")]
    public async Task<IActionResult> My() => Ok(new { Success = true, Data = await _svc.GetMyAsync(UserId) });

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var a = await _svc.GetByIdAsync(id, UserId, UserRole);
        return a != null ? Ok(new { Success = true, Data = a }) : NotFound();
    }

    [Authorize(Roles = "student"), HttpPost("{id}/feedback")]
    public async Task<IActionResult> Feedback(int id, [FromBody] FeedbackDto dto)
    {
        return await _svc.SubmitFeedbackAsync(id, UserId, dto) ? Ok(new { Success = true }) : NotFound();
    }
}
