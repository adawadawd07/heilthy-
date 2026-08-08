# End-to-end smoke test for the account system.
# Usage:  node -v; npm run dev   (in another terminal), then:  powershell -File scripts/auth-smoke.ps1
$ErrorActionPreference = 'Continue'
$base = 'http://localhost:3000'
$pass = 0
$fail = 0
# Unique names keep the run repeatable against a database that already has users.
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$userA = "test_a$stamp"
$userB = "test_b$stamp"

function Invoke-Api {
    param($Method, $Path, $Body, $Session, [switch]$NoRedirect)
    $req = @{ Uri = "$base$Path"; Method = $Method; ErrorAction = 'Stop'; UseBasicParsing = $true }
    if ($Body) { $req.Body = [Text.Encoding]::UTF8.GetBytes($Body); $req.ContentType = 'application/json' }
    if ($Session) { $req.WebSession = $Session }
    if ($NoRedirect) { $req.MaximumRedirection = 0 }
    try {
        $r = Invoke-WebRequest @req
        return @{ Code = [int]$r.StatusCode; Body = $r.Content; Location = $r.Headers.Location }
    } catch {
        $resp = $_.Exception.Response
        if ($null -eq $resp) { return @{ Code = 0; Body = $_.Exception.Message } }
        $body = ''
        try { $body = (New-Object IO.StreamReader($resp.GetResponseStream())).ReadToEnd() } catch {}
        return @{ Code = [int]$resp.StatusCode; Body = $body; Location = $resp.Headers['Location'] }
    }
}

function Check($label, $actual, $expected) {
    if ("$actual" -eq "$expected") {
        Write-Host ("  PASS  {0,-42} {1}" -f $label, $actual) -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host ("  FAIL  {0,-42} got {1}, want {2}" -f $label, $actual, $expected) -ForegroundColor Red
        $script:fail++
    }
}

Write-Host "`n== anonymous access is blocked =="
Check 'GET /api/meals'  (Invoke-Api GET '/api/meals').Code  401
Check 'GET /api/stats'  (Invoke-Api GET '/api/stats').Code  401
Check 'GET /api/user'   (Invoke-Api GET '/api/user').Code   401
Check 'GET /api/export' (Invoke-Api GET '/api/export').Code 401
Check 'POST /api/analyze' (Invoke-Api POST '/api/analyze' '{"image":"x"}').Code 401
$home_ = Invoke-Api GET '/' $null $null -NoRedirect
Check 'GET / redirects'   $home_.Code 307

Write-Host "`n== signup / login rules =="
$ahmad = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$sara = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Check 'signup user A'       (Invoke-Api POST '/api/auth' "{`"mode`":`"signup`",`"username`":`"$userA`",`"password`":`"secret123`"}" $ahmad).Code 200
Check 'signup user B'       (Invoke-Api POST '/api/auth' "{`"mode`":`"signup`",`"username`":`"$userB`",`"password`":`"secret456`"}" $sara).Code 200
Check 'duplicate (any case)' (Invoke-Api POST '/api/auth' "{`"mode`":`"signup`",`"username`":`"$($userA.ToUpper())`",`"password`":`"secret123`"}").Code 409
Check 'short password'      (Invoke-Api POST '/api/auth' '{"mode":"signup","username":"bobbie","password":"123"}').Code 400
Check 'short username'      (Invoke-Api POST '/api/auth' '{"mode":"signup","username":"ab","password":"secret123"}').Code 400
Check 'invalid characters'  (Invoke-Api POST '/api/auth' '{"mode":"signup","username":"bad name!","password":"secret123"}').Code 400
Check 'wrong password'      (Invoke-Api POST '/api/auth' "{`"mode`":`"login`",`"username`":`"$userA`",`"password`":`"nope12345`"}").Code 401
Check 'unknown user'        (Invoke-Api POST '/api/auth' '{"mode":"login","username":"ghost_nobody","password":"secret123"}').Code 401
Check 'correct login'       (Invoke-Api POST '/api/auth' "{`"mode`":`"login`",`"username`":`"$userA`",`"password`":`"secret123`"}" $ahmad).Code 200

Write-Host "`n== password hash never leaves the server =="
$me = (Invoke-Api GET '/api/user' $null $ahmad).Body
Check 'GET /api/user no hash' ($me -notmatch 'password_hash') True

Write-Host "`n== each account keeps its own meals =="
$mealA = '{"meal_type":"lunch","source":"manual","items":[{"id":"1","meal_id":"t","food_id":"3","name":"Chicken","name_ar":"دجاج","name_en":"Chicken","quantity":2,"unit":"g","weight_g":200,"calories":330,"protein_g":62,"carbs_g":0,"fat_g":7.2}]}'
$mealB = '{"meal_type":"breakfast","source":"manual","items":[{"id":"2","meal_id":"t","food_id":"1","name":"Egg","name_ar":"بيض","name_en":"Egg","quantity":2,"unit":"piece","weight_g":100,"calories":155,"protein_g":13,"carbs_g":1.1,"fat_g":11}]}'

Check 'ahmad saves a meal'  (Invoke-Api POST '/api/meals' $mealA $ahmad).Code 200
Check 'sara saves a meal'   (Invoke-Api POST '/api/meals' $mealB $sara).Code 200

$listA = (Invoke-Api GET '/api/meals' $null $ahmad).Body | ConvertFrom-Json
$listB = (Invoke-Api GET '/api/meals' $null $sara).Body | ConvertFrom-Json
Check 'ahmad sees 1 meal'   $listA.Count 1
Check 'sara sees 1 meal'    $listB.Count 1
Check 'ahmad meal is his'   $listA[0].total_calories 330
Check 'sara meal is hers'   $listB[0].total_calories 155

Write-Host "`n== cross-account access is denied =="
$saraMealId = $listB[0].id
Check 'ahmad GET sara meal'    (Invoke-Api GET "/api/meals/$saraMealId" $null $ahmad).Code 404
Check 'ahmad DELETE sara meal' (Invoke-Api DELETE "/api/meals/$saraMealId" $null $ahmad).Code 404
Check 'sara meal still there'  ((Invoke-Api GET '/api/meals' $null $sara).Body | ConvertFrom-Json).Count 1

Write-Host "`n== goals are per account =="
Check 'ahmad sets 1800 kcal' (Invoke-Api PATCH '/api/user' '{"daily_calories":1800,"daily_protein_g":150}' $ahmad).Code 200
$goalA = ((Invoke-Api GET '/api/user' $null $ahmad).Body | ConvertFrom-Json).user.daily_calories
$goalB = ((Invoke-Api GET '/api/user' $null $sara).Body | ConvertFrom-Json).user.daily_calories
Check 'ahmad goal = 1800'    $goalA 1800
Check 'sara goal untouched'  $goalB 2000

Write-Host "`n== data survives a logout / login round trip =="
Check 'ahmad logs out'       (Invoke-Api DELETE '/api/auth' $null $ahmad).Code 200
Check 'logged out is 401'    (Invoke-Api GET '/api/meals' $null $ahmad).Code 401
$again = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Check 'ahmad logs back in'   (Invoke-Api POST '/api/auth' "{`"mode`":`"login`",`"username`":`"$userA`",`"password`":`"secret123`"}" $again).Code 200
$after = (Invoke-Api GET '/api/meals' $null $again).Body | ConvertFrom-Json
Check 'meal still saved'     $after.Count 1
Check 'goal still saved'     ((Invoke-Api GET '/api/user' $null $again).Body | ConvertFrom-Json).user.daily_calories 1800

Write-Host "`n== cleanup =="
Check 'delete ahmad account' (Invoke-Api DELETE '/api/account' $null $again).Code 200
Check 'delete sara account'  (Invoke-Api DELETE '/api/account' $null $sara).Code 200

Write-Host "`n$pass passed, $fail failed`n" -ForegroundColor $(if ($fail -eq 0) { 'Green' } else { 'Red' })
if ($fail -gt 0) { exit 1 }
