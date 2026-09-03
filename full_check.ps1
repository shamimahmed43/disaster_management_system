# ============================================================
# DMS PROJECT - FULL END-TO-END HEALTH CHECK
# Checks: Ports, Backend APIs, Frontend Pages, Oracle DB
# ============================================================

$global:PASS = 0
$global:FAIL = 0
$global:WARN = 0

function Write-Header($title) {
    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host ("=" * 70) -ForegroundColor Cyan
}

function Write-Section($title) {
    Write-Host ""
    Write-Host "--- $title ---" -ForegroundColor Yellow
}

function OK($msg) {
    Write-Host "  [PASS] $msg" -ForegroundColor Green
    $global:PASS++
}

function FAIL($msg) {
    Write-Host "  [FAIL] $msg" -ForegroundColor Red
    $global:FAIL++
}

function WARN($msg) {
    Write-Host "  [WARN] $msg" -ForegroundColor Yellow
    $global:WARN++
}

function INFO($msg) {
    Write-Host "  [INFO] $msg" -ForegroundColor Gray
}

# ─────────────────────────────────────────────────────────────
# 1. CHECK PORTS
# ─────────────────────────────────────────────────────────────
Write-Header "1. PORT STATUS CHECK"

Write-Section "Checking Port 5000 (Backend)"
$port5000 = netstat -ano | findstr ":5000" | findstr "LISTENING"
if ($port5000) {
    OK "Port 5000 is LISTENING (Backend is up)"
    INFO "$port5000"
} else {
    FAIL "Port 5000 NOT listening - Backend may not be running"
}

Write-Section "Checking Port 3000 (Frontend)"
$port3000 = netstat -ano | findstr ":3000" | findstr "LISTENING"
if ($port3000) {
    OK "Port 3000 is LISTENING (Frontend is up)"
    INFO "$port3000"
} else {
    FAIL "Port 3000 NOT listening - Frontend may not be running"
}

Write-Section "Checking Port 1521 (Oracle DB)"
$port1521 = netstat -ano | findstr ":1521" | findstr "LISTENING"
if ($port1521) {
    OK "Port 1521 is LISTENING (Oracle DB listener is up)"
} else {
    FAIL "Port 1521 NOT listening - Oracle DB/Listener may not be running"
}

# ─────────────────────────────────────────────────────────────
# 2. BACKEND HEALTH & STATUS API
# ─────────────────────────────────────────────────────────────
Write-Header "2. BACKEND API HEALTH CHECKS"

function Test-API($label, $url, $method = "GET", $body = $null) {
    try {
        $params = @{
            Uri             = $url
            Method          = $method
            TimeoutSec      = 8
            UseBasicParsing = $true
            ErrorAction     = "Stop"
        }
        if ($body) {
            $params.Body        = ($body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        $resp = Invoke-WebRequest @params
        $status = $resp.StatusCode
        if ($status -ge 200 -and $status -lt 300) {
            OK "$label => HTTP $status"
            $preview = $resp.Content.Substring(0, [Math]::Min(200, $resp.Content.Length))
            INFO "Response: $preview"
            try { return $resp.Content | ConvertFrom-Json } catch { return $null }
        } else {
            FAIL "$label => HTTP $status"
            return $null
        }
    } catch {
        $errMsg = $_.Exception.Message
        if ($errMsg -match "401") {
            WARN "$label => 401 Unauthorized (auth required - correct for protected routes)"
        } elseif ($errMsg -match "403") {
            WARN "$label => 403 Forbidden"
        } elseif ($errMsg -match "404") {
            FAIL "$label => 404 Not Found"
        } elseif ($errMsg -match "connection|refused|actively refused") {
            FAIL "$label => Connection refused - server not running"
        } else {
            FAIL "$label => $errMsg"
        }
        return $null
    }
}

Write-Section "Core Health Endpoints"
$health = Test-API "GET /api/health" "http://localhost:5000/api/health"
$statusResp = Test-API "GET /api/status" "http://localhost:5000/api/status"

if ($statusResp -and $statusResp.data) {
    $dbOk = $statusResp.data.database
    if ($dbOk) {
        OK "Backend reports: Oracle DB is CONNECTED"
    } else {
        FAIL "Backend reports: Oracle DB NOT connected - $($statusResp.data.db_message)"
    }
}

Write-Section "Dashboard API"
Test-API "GET /api/dashboard" "http://localhost:5000/api/dashboard" | Out-Null

Write-Section "Disasters API"
Test-API "GET /api/disasters" "http://localhost:5000/api/disasters" | Out-Null
Test-API "GET /api/disasters/stats" "http://localhost:5000/api/disasters/stats" | Out-Null

Write-Section "Victims API"
Test-API "GET /api/victims" "http://localhost:5000/api/victims" | Out-Null

Write-Section "Shelters API"
Test-API "GET /api/shelters" "http://localhost:5000/api/shelters" | Out-Null
Test-API "GET /api/shelters/stats" "http://localhost:5000/api/shelters/stats" | Out-Null

Write-Section "Warehouses API"
Test-API "GET /api/warehouses" "http://localhost:5000/api/warehouses" | Out-Null

Write-Section "Vehicles API"
Test-API "GET /api/vehicles" "http://localhost:5000/api/vehicles" | Out-Null
Test-API "GET /api/vehicles/stats" "http://localhost:5000/api/vehicles/stats" | Out-Null

Write-Section "Donations API"
Test-API "GET /api/donations" "http://localhost:5000/api/donations" | Out-Null

Write-Section "Distributions API"
Test-API "GET /api/distributions" "http://localhost:5000/api/distributions" | Out-Null

Write-Section "Personnel API"
Test-API "GET /api/personnel" "http://localhost:5000/api/personnel" | Out-Null
Test-API "GET /api/personnel/stats" "http://localhost:5000/api/personnel/stats" | Out-Null
Test-API "GET /api/personnel/volunteers" "http://localhost:5000/api/personnel/volunteers" | Out-Null

Write-Section "Users API"
Test-API "GET /api/users" "http://localhost:5000/api/users" | Out-Null

Write-Section "Auth API (route existence check)"
try {
    $loginBody = @{ username = "test"; password = "test" }
    $r = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST `
        -Body ($loginBody | ConvertTo-Json) -ContentType "application/json" `
        -UseBasicParsing -TimeoutSec 8 -ErrorAction Stop
    WARN "POST /api/auth/login => HTTP $($r.StatusCode) (unexpected success with dummy creds)"
} catch {
    $errMsg = $_.Exception.Message
    if ($errMsg -match "401|400") {
        OK "POST /api/auth/login => Route exists (401/400 for bad creds - correct)"
    } elseif ($errMsg -match "connection|refused") {
        FAIL "POST /api/auth/login => Connection refused"
    } else {
        WARN "POST /api/auth/login => $errMsg"
    }
}

# ─────────────────────────────────────────────────────────────
# 3. FRONTEND PAGE CHECKS
# ─────────────────────────────────────────────────────────────
Write-Header "3. FRONTEND PAGE CHECKS"

$frontendPages = @(
    @{ label = "Home / Login Page";  path = "/" },
    @{ label = "Dashboard";          path = "/dashboard" },
    @{ label = "Disasters";          path = "/disasters" },
    @{ label = "Victims";            path = "/victims" },
    @{ label = "Shelters";           path = "/shelters" },
    @{ label = "Vehicles";           path = "/vehicles" },
    @{ label = "Donations";          path = "/donations" },
    @{ label = "Personnel";          path = "/personnel" },
    @{ label = "Volunteers";         path = "/volunteers" },
    @{ label = "Warehouse";          path = "/warehouse" },
    @{ label = "Operations";         path = "/operations" },
    @{ label = "Relief";             path = "/relief" },
    @{ label = "Map";                path = "/map" },
    @{ label = "Users (Admin)";      path = "/users" },
    @{ label = "Admin Panel";        path = "/admin" },
    @{ label = "Audit Log";          path = "/audit" },
    @{ label = "Query Builder";      path = "/query-builder" },
    @{ label = "View";               path = "/view" }
)

foreach ($page in $frontendPages) {
    $url = "http://localhost:3000$($page.path)"
    try {
        $r = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($r.StatusCode -eq 200) {
            OK "$($page.label) [$($page.path)] => HTTP 200 OK"
        } else {
            WARN "$($page.label) [$($page.path)] => HTTP $($r.StatusCode)"
        }
    } catch {
        $errMsg = $_.Exception.Message
        if ($errMsg -match "307|302|redirect") {
            WARN "$($page.label) [$($page.path)] => Redirect (auth-protected)"
        } elseif ($errMsg -match "connection|refused") {
            FAIL "$($page.label) [$($page.path)] => Frontend NOT running"
        } else {
            WARN "$($page.label) [$($page.path)] => $errMsg"
        }
    }
}

# ─────────────────────────────────────────────────────────────
# 4. ORACLE DATABASE CHECK VIA SQLPLUS
# ─────────────────────────────────────────────────────────────
Write-Header "4. ORACLE DATABASE CHECK (sqlplus)"

$dbUser = "system"
$dbPass = "202414043"
$dbConn = "localhost:1521/XE"

$envPath = "d:\DBMS_Project\backend\.env"
if (Test-Path $envPath) {
    foreach ($line in Get-Content $envPath) {
        if ($line -match "^DB_USER=(.+)")              { $dbUser = $Matches[1].Trim() }
        if ($line -match "^DB_PASSWORD=(.+)")          { $dbPass = $Matches[1].Trim() }
        if ($line -match "^DB_CONNECTION_STRING=(.+)") { $dbConn = $Matches[1].Trim() }
    }
    INFO "Credentials loaded from .env: $dbUser @ $dbConn"
}

Write-Section "Oracle Connectivity & Table Row Counts"

$sqlScript = @"
SET PAGESIZE 100
SET LINESIZE 100
SET FEEDBACK ON
SET HEADING ON
SET ECHO OFF

SELECT 'DB_ALIVE: Connected as ' || USER || ' at ' || TO_CHAR(SYSDATE,'DD-MON-YYYY HH24:MI:SS') AS STATUS FROM DUAL;

PROMPT.
PROMPT == TABLE ROW COUNTS ==
SELECT 'DISASTERS'     AS TABLE_NAME, COUNT(*) AS ROW_COUNT FROM DISASTERS    UNION ALL
SELECT 'VICTIMS'       AS TABLE_NAME, COUNT(*) AS ROW_COUNT FROM VICTIMS       UNION ALL
SELECT 'SHELTERS'      AS TABLE_NAME, COUNT(*) AS ROW_COUNT FROM SHELTERS      UNION ALL
SELECT 'WAREHOUSES'    AS TABLE_NAME, COUNT(*) AS ROW_COUNT FROM WAREHOUSES    UNION ALL
SELECT 'VEHICLES'      AS TABLE_NAME, COUNT(*) AS ROW_COUNT FROM VEHICLES      UNION ALL
SELECT 'DONATIONS'     AS TABLE_NAME, COUNT(*) AS ROW_COUNT FROM DONATIONS     UNION ALL
SELECT 'DISTRIBUTIONS' AS TABLE_NAME, COUNT(*) AS ROW_COUNT FROM DISTRIBUTIONS UNION ALL
SELECT 'PERSONNEL'     AS TABLE_NAME, COUNT(*) AS ROW_COUNT FROM PERSONNEL     UNION ALL
SELECT 'USERS'         AS TABLE_NAME, COUNT(*) AS ROW_COUNT FROM USERS;

PROMPT.
PROMPT == TRIGGERS ==
SELECT trigger_name, status FROM user_triggers ORDER BY trigger_name;

PROMPT.
PROMPT == SEQUENCES ==
SELECT sequence_name, last_number FROM user_sequences ORDER BY sequence_name;

EXIT;
"@

$tmpSql = "$env:TEMP\dms_health_check.sql"
$sqlScript | Out-File -FilePath $tmpSql -Encoding ASCII

Write-Host "  Running sqlplus $dbUser/***@$dbConn ..." -ForegroundColor Gray
Write-Host ""

try {
    $output = & sqlplus -S "$dbUser/$dbPass@$dbConn" "@$tmpSql" 2>&1
    $outputStr = $output -join "`n"

    Write-Host "  ---- SQLPLUS OUTPUT ----------------------------------------" -ForegroundColor Cyan
    $output | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
    Write-Host "  ------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host ""

    # Analyze output
    if ($outputStr -match "DB_ALIVE:") {
        OK "Oracle DB connection successful - SELECT from DUAL works"
    } elseif ($outputStr -match "ORA-01017|ORA-1017") {
        FAIL "Oracle: Invalid username/password - check .env credentials"
    } elseif ($outputStr -match "ORA-12541|TNS-12541") {
        FAIL "Oracle: No listener - start OracleOraDB21Home1TNSListener service"
    } elseif ($outputStr -match "ORA-12514|TNS-12514") {
        FAIL "Oracle: Listener does not know the service - check DB_CONNECTION_STRING"
    } elseif ($outputStr -match "ORA-|TNS-|SP2-") {
        $errors = ($output | Where-Object { $_ -match "ORA-|TNS-|SP2-" }) -join "; "
        FAIL "Oracle Error: $errors"
    } else {
        WARN "Could not confirm Oracle connectivity (unexpected output)"
    }

    # Table check
    $tables = "DISASTERS","VICTIMS","SHELTERS","WAREHOUSES","VEHICLES","DONATIONS","DISTRIBUTIONS","PERSONNEL","USERS"
    $tablesFound = 0
    foreach ($t in $tables) {
        if ($outputStr -match $t) { $tablesFound++ }
    }
    if ($tablesFound -eq $tables.Count) {
        OK "All $($tables.Count) DMS tables found in Oracle DB"
    } elseif ($tablesFound -gt 0) {
        WARN "Only $tablesFound of $($tables.Count) tables found - run database setup scripts"
    } else {
        FAIL "No DMS tables found - database may not be initialized (run d:\DBMS_Project\database\ scripts)"
    }

    # Trigger check
    if ($outputStr -match "trigger_name" -or $outputStr -match "TRG_|TRIGGER") {
        OK "Triggers found in Oracle DB"
    } else {
        WARN "No triggers detected or trigger query failed"
    }

} catch {
    FAIL "sqlplus execution failed: $($_.Exception.Message)"
    WARN "Ensure sqlplus.exe is in PATH (Oracle 21c XE bin directory)"
}

# ─────────────────────────────────────────────────────────────
# 5. ORACLE SERVICES & LISTENER
# ─────────────────────────────────────────────────────────────
Write-Header "5. ORACLE WINDOWS SERVICES & LISTENER"

Write-Section "Oracle Windows Services"
$oraServices = Get-Service | Where-Object { $_.DisplayName -match "Oracle" } | Select-Object Name, DisplayName, Status
if ($oraServices) {
    foreach ($svc in $oraServices) {
        if ($svc.Status -eq "Running") {
            OK "$($svc.DisplayName) => $($svc.Status)"
        } else {
            FAIL "$($svc.DisplayName) => $($svc.Status)"
        }
    }
} else {
    WARN "No Oracle Windows services found - Oracle may not be installed"
}

Write-Section "Oracle Listener (lsnrctl)"
try {
    $lsnr = & lsnrctl status 2>&1
    $lsnrStr = $lsnr -join "`n"
    if ($lsnrStr -match "The command completed successfully") {
        OK "Oracle Listener running (lsnrctl status OK)"
        $lsnr | Where-Object { $_ -match "Alias|Version|Port|Service" } | ForEach-Object { INFO $_ }
    } elseif ($lsnrStr -match "TNS-|error") {
        FAIL "Oracle Listener error detected"
        $lsnr | Where-Object { $_ -match "TNS-|error" } | Select-Object -First 3 | ForEach-Object { INFO $_ }
    } else {
        WARN "lsnrctl returned unexpected output"
        $lsnr | Select-Object -First 5 | ForEach-Object { INFO $_ }
    }
} catch {
    WARN "lsnrctl not in PATH - check Oracle 21c installation"
}

# ─────────────────────────────────────────────────────────────
# 6. CURL VERIFICATION
# ─────────────────────────────────────────────────────────────
Write-Header "6. CURL VERIFICATION (raw HTTP status codes)"

$curlRoutes = @(
    @{ url = "http://localhost:5000/api/health";        label = "Backend /api/health" },
    @{ url = "http://localhost:5000/api/status";        label = "Backend /api/status" },
    @{ url = "http://localhost:5000/api/dashboard";     label = "Backend /api/dashboard" },
    @{ url = "http://localhost:5000/api/disasters";     label = "Backend /api/disasters" },
    @{ url = "http://localhost:5000/api/victims";       label = "Backend /api/victims" },
    @{ url = "http://localhost:5000/api/shelters";      label = "Backend /api/shelters" },
    @{ url = "http://localhost:5000/api/warehouses";    label = "Backend /api/warehouses" },
    @{ url = "http://localhost:5000/api/vehicles";      label = "Backend /api/vehicles" },
    @{ url = "http://localhost:5000/api/donations";     label = "Backend /api/donations" },
    @{ url = "http://localhost:5000/api/distributions"; label = "Backend /api/distributions" },
    @{ url = "http://localhost:5000/api/personnel";     label = "Backend /api/personnel" },
    @{ url = "http://localhost:5000/api/users";         label = "Backend /api/users" },
    @{ url = "http://localhost:3000";                   label = "Frontend Home" }
)

$curlAvail = Get-Command curl.exe -ErrorAction SilentlyContinue
if ($curlAvail) {
    foreach ($r in $curlRoutes) {
        $code = (curl.exe -s -o NUL -w "%{http_code}" --max-time 8 $r.url 2>&1).Trim()
        if ($code -match "^2\d\d$") {
            OK "$($r.label) => $code"
        } elseif ($code -match "^(401|403)$") {
            WARN "$($r.label) => $code (auth-protected - OK)"
        } elseif ($code -eq "000") {
            FAIL "$($r.label) => No response (server down)"
        } else {
            FAIL "$($r.label) => $code"
        }
    }
} else {
    INFO "curl.exe not found in PATH - skipping curl section"
    INFO "PowerShell Invoke-WebRequest checks above cover the same routes"
}

# ─────────────────────────────────────────────────────────────
# FINAL SUMMARY
# ─────────────────────────────────────────────────────────────
Write-Header "FINAL SUMMARY"

$total = $global:PASS + $global:FAIL + $global:WARN
Write-Host ""
Write-Host "  Total Checks : $total" -ForegroundColor White
Write-Host "  PASSED       : $($global:PASS)" -ForegroundColor Green
Write-Host "  FAILED       : $($global:FAIL)" -ForegroundColor Red
Write-Host "  WARNINGS     : $($global:WARN)" -ForegroundColor Yellow
Write-Host ""

if ($global:FAIL -eq 0) {
    Write-Host "  ALL CHECKS PASSED - System is fully operational!" -ForegroundColor Green
} elseif ($global:FAIL -le 3) {
    Write-Host "  SOME CHECKS FAILED - See [FAIL] items above." -ForegroundColor Yellow
} else {
    Write-Host "  MULTIPLE FAILURES - System may not be running properly." -ForegroundColor Red
    Write-Host ""
    Write-Host "  QUICK FIX:" -ForegroundColor Yellow
    Write-Host "    1. Run: d:\DBMS_Project\restart.bat (as Administrator)" -ForegroundColor White
    Write-Host "    2. Wait 30 seconds for servers to start" -ForegroundColor White
    Write-Host "    3. Re-run: powershell -File d:\DBMS_Project\full_check.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "  Check complete at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host ""

Remove-Item $tmpSql -ErrorAction SilentlyContinue
