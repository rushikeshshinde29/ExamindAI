using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizMasterPro.API.DTOs.Auth;
using QuizMasterPro.API.Services;

namespace QuizMasterPro.API.Controllers;

[Route("api/auth")]
public class AuthController : BaseController
{
    private readonly AuthService _svc;
    public AuthController(AuthService svc) { _svc = svc; }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var r = await _svc.RegisterAsync(dto);
        return r.Success ? StatusCode(201, r) : BadRequest(r);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var r = await _svc.LoginAsync(dto);
        return r.Success ? Ok(r) : Unauthorized(r);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var r = await _svc.ForgotPasswordAsync(dto.Email);
        return r.Success ? Ok(r) : StatusCode(502, r);
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var r = await _svc.ResetPasswordAsync(dto);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [Authorize, HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var u = await _svc.GetMeAsync(UserId);
        return u != null ? Ok(new { Success = true, User = u }) : NotFound();
    }

    [Authorize, HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var r = await _svc.UpdateProfileAsync(UserId, dto);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [Authorize, HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var r = await _svc.ChangePasswordAsync(UserId, dto);
        return r.Success ? Ok(r) : BadRequest(r);
    }
}
