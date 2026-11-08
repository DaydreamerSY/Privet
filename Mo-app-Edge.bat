@echo off
rem Mo app hoc tieng Nga (ban web, co dong bo Google Drive) bang Microsoft Edge.
rem Edge co san giong doc tieng Nga. Khong co Edge thi dung Google Chrome, cuoi cung la trinh duyet mac dinh.
rem Khong co mang: nhay dup file index.html (ban tren may, khong dong bo duoc).
setlocal
set "APP=https://daydreamersy.github.io/Privet/"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" goto edge
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto chrome
start "" "%APP%"
exit /b
:edge
start "" "%EDGE%" "%APP%"
exit /b
:chrome
start "" "%CHROME%" "%APP%"
exit /b
