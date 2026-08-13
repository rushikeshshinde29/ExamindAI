using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizMasterPro.API.Data;

namespace QuizMasterPro.API.Controllers;

[Authorize, Route("api/certificates")]
public class CertificatesController : BaseController
{
    private readonly AppDbContext _db;
    public CertificatesController(AppDbContext db) { _db = db; }

    [HttpGet("my")]
    public async Task<IActionResult> My()
    {
        var certs = await _db.Certificates.Where(c => c.StudentId == UserId).OrderByDescending(c => c.IssuedAt).ToListAsync();
        return Ok(new { Success = true, Data = certs });
    }

    [AllowAnonymous, HttpGet("verify/{certId}")]
    public async Task<IActionResult> Verify(string certId)
    {
        var c = await _db.Certificates.FirstOrDefaultAsync(x => x.CertificateId == certId);
        if (c == null) return NotFound(new { Success = false, Valid = false, Message = "Invalid certificate" });
        return Ok(new { Success = true, Valid = true, Data = new { c.StudentName, c.QuizTitle, c.Subject, c.Score, c.ObtainedMarks, c.TotalMarks, c.IssuedAt, c.Department } });
    }
}
