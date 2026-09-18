curl.exe -X POST -H "Content-Type: application/json" -d @payload.json http://localhost:5000/api/auth/internal/login -c cookie.txt
curl.exe -b cookie.txt http://localhost:5000/api/personnel -o personnel.json
curl.exe -b cookie.txt http://localhost:5000/api/personnel/volunteers -o volunteers.json
curl.exe -b cookie.txt http://localhost:5000/api/personnel/medical -o medical.json
