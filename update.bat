@echo off
echo Yenilikler gonderilir...
git add .
git commit -m "Avtomatik yeniləmə: %date% %time%"
git push origin main
echo Hazirdir!
pause