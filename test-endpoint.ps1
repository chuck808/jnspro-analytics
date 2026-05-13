$body = @{
    device_id = "test"
    device_secret = "test"
    filename = "test.json"
    content_type = "application/json"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "https://kxmpixsukzmbchjqhsku.supabase.co/functions/v1/request-upload-url" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host "Status Code: $($response.StatusCode)"
    Write-Host "Response Body: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
