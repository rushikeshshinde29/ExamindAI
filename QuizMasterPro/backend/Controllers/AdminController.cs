using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizMasterPro.API.DTOs.Admin;
using QuizMasterPro.API.Services;

namespace QuizMasterPro.API.Controllers;

[Authorize(Roles = "admin"), Route("api/admin")]
public class AdminController : BaseController
{
    private readonly AdminService _svc;
    public AdminController(AdminService svc) { _svc = svc; }

    [HttpGet("stats")] public async Task<IActionResult> Stats() => Ok(new { Success = true, Data = await _svc.GetStatsAsync() });

    [HttpGet("users/{role}")]
    public async Task<IActionResult> Users(string role, [FromQuery] int page = 1, [FromQuery] int limit = 20, [FromQuery] string? search = null)
        => Ok(new { Success = true, Data = await _svc.GetUsersAsync(role, page, limit, search) });

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (ok, msg) = await _svc.CreateUserAsync(dto);
        return ok ? StatusCode(201, new { Success = true, Message = msg }) : BadRequest(new { Success = false, Message = msg });
    }

    [HttpPut("users/{id}/status")]
    public async Task<IActionResult> Status(int id, [FromBody] UpdateUserStatusDto dto)
    {
        var (ok, msg) = await _svc.UpdateUserStatusAsync(id, dto);
        return ok ? Ok(new { Success = true, Message = msg }) : NotFound(new { Success = false, Message = msg });
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var (ok, msg) = await _svc.DeleteUserAsync(id);
        return ok ? Ok(new { Success = true }) : BadRequest(new { Success = false, Message = msg });
    }

    [HttpGet("quizzes")]
    public async Task<IActionResult> Quizzes() => Ok(new { Success = true, Data = await _svc.GetAllQuizzesAsync() });
}
