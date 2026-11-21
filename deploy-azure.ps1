# Publishes the simulator to Azure Static Web Apps (Free plan).
# Only the runtime files in azure-site\ are uploaded, never the raw client or character exports.
param([string]$Name = 'ro3-damage-sim', [string]$ResourceGroup = "rg-$Name")
$ErrorActionPreference = 'Stop'
$az = if (Get-Command az -ErrorAction SilentlyContinue) { 'az' } else { "$env:USERPROFILE\.tools\azure-cli\bin\az.cmd" }

Copy-Item "$PSScriptRoot\ro3-damage-sim.html" "$PSScriptRoot\azure-site\index.html" -Force
$allowed = @('index.html', 'staticwebapp.config.json', 'robots.txt')
$files = @(Get-ChildItem -LiteralPath "$PSScriptRoot\azure-site" -Force)
if ($files.Count -ne $allowed.Count -or ($files | Where-Object { $_.Name -notin $allowed -or $_.PSIsContainer -or ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) })) {
    throw 'Azure staging must contain only index.html, staticwebapp.config.json and robots.txt. Inspect azure-site before deploying.'
}
# The deployment token goes to the SWA CLI through the environment, never onto a command line or into a file.
$previousToken = $env:SWA_CLI_DEPLOYMENT_TOKEN
try {
    $env:SWA_CLI_DEPLOYMENT_TOKEN = & $az staticwebapp secrets list -n $Name -g $ResourceGroup --query 'properties.apiKey' -o tsv --only-show-errors
    if ($LASTEXITCODE -or -not $env:SWA_CLI_DEPLOYMENT_TOKEN) { throw "Could not read the deployment token of $Name in ${ResourceGroup} (run az login first)." }
    & npx.cmd --yes '@azure/static-web-apps-cli' deploy "$PSScriptRoot\azure-site" --env production
    if ($LASTEXITCODE) { throw 'swa deploy failed.' }
} finally {
    $env:SWA_CLI_DEPLOYMENT_TOKEN = $previousToken
}
"https://$(& $az staticwebapp show -n $Name -g $ResourceGroup --query defaultHostname -o tsv)"
