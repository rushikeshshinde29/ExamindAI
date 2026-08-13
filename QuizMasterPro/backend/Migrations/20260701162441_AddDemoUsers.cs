using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace QuizMasterPro.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDemoUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$sBvW7ACvB2xK/MgoWjRP4eMOXl7ydWBPYY/XfRVquV484j2M7sExm");

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Avatar", "BanReason", "Bio", "Course", "CreatedAt", "Department", "Designation", "Email", "EmployeeId", "EnrollmentYear", "IsActive", "IsBanned", "IsEmailVerified", "LastAttemptDate", "LastLogin", "Level", "LoginCount", "Name", "PasswordHash", "PasswordResetExpires", "PasswordResetToken", "Phone", "Role", "Specialization", "Streak", "StudentId", "TotalPoints", "UpdatedAt" },
                values: new object[,]
                {
                    { 2, "", "", "", "", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "", "", "faculty@demo.com", "", "", true, false, true, null, null, 1, 0, "Demo Faculty", "$2a$11$SMUaJe/DxRHj51qMpoZ0xOz3UElweJupdYqSxcAn.J6qkZnvvcCx.", null, null, "", "faculty", "", 0, "", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 3, "", "", "", "", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "", "", "student@demo.com", "", "", true, false, true, null, null, 1, 0, "Demo Student", "$2a$11$jOvRqewFI4U6qvzFafin9O16KJvMqwSjvZLKOCMXi.ZqLzpR5HjDW", null, null, "", "student", "", 0, "", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$aIJF/T3pxxdBYo6rCTLjbet1k21yDOPW7ssXrzQpMQdzvRmj.u2Ce");
        }
    }
}
