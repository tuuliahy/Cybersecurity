In this excercise "The Booking system project → Phase 3" I used the given code because there was already the reservation feature. 
I used Zap to find some vulnerabilities. It was a bit suprise that weren't any medium or high risks: only one low category risk and 6
informational vulnerabilities. To find some vulnerabilities I also made functional test to application. 

1. To limit reservations with same time (XSS Weakness)
- From Zap resport I received this vulnerability: "Cross Site Scripting Weakness (Persistent in JSON Response)"
- It should be so that, for the same time, you can't make more than one reservation for the same resource. This is one of the ways to perform a DoS or DDoS attack that overloads the system and prevents access in the worst case.
- I found this after using the Zap Manual Explore and I reliased after that whole page in the browser was full with the reservations that were at same time. After I also reliased that these reservations were also saved to database. And same was with the resources table. 
- This should be fixed so that there would be a limit of one reservation for resource at same time. To do this there should be the extra code&database for keeping track of reservations and prevent to make an another reservation for same resource at same time. 

2. The lack of 2FA
- When logging to application there isn't the 2FA login. 
- I found this when I did the functionality test for the application and 2FA/MFA is commonly used nowadays and I read about that from some course material. 
- It should as fast as possible to add the 2FA so that when the user logins he needs to use for example also the code received by email or text message to login or for example the Microsoft Authentication application. With this it is possible to reduce the risk of Brute Force attacka and also reduce the risk that the attacker can steal sensitive information when it isn't possible to login only with the username and password. 


3. Lack of locking the password 
- There is no password locking after for example 5 tries. So now attacker can tries to login as many times as he wants. 
- I noticed this actually when I tried to think about any risk or vulnerabilities when making the functional test. Then I realised that this is actually a quite big vulnerability because without this the Brute force -attack might manage. 
- Password should get locked after certain tries. There also should be the way to reset the account if the password has locked. When reseting the account there should be use of some other authentication method like text message with code to phone number or to email (this should be added to registration form) to reset the account instead of that the password resets itself after certain time. This is one way to authenticate better that the user is really the one who's account he tries to login. This is also one easy way to prevent Brute Force attacks. 


4. Loosely Scoped Cookies
- This vulnerability I got from Zap. I got familiar with this by reading the code and finding the parts where the cookies were set (I used the teachers code which what I wasn't so familiar). This vulnerability isn't so serious when using the development environment and the address of http://localhost:8000/ but when using production and real domain this is important thing. 
- This vulnerability can be reduced when using the code below where the domain attribute is setted to cookies/sessions: 
"Set-Cookie": `session_id=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Domain=localhost`
- It is important to do this fixing because it denies the session's use in other domains. Without this restriction, the session/cookie could be stolen or hijacked.


5. The email (username) of every reservations are shown for all the users who has logged in 
- When user logins, he can see all the reservations made and see the email of reservers. This is a significant security vulnerability because also the attackers can see the users email and try to login to their account and get their information (like birthdate). And when the attacker knows the username he can easier do the Brute Force attack. 
- I found this when I did the functional test to application and try this way found some cyber security problems. I validate this by using the user both the "reserver" and "administration" role. 
- This should be fixed so that other users don't see the others users email when looking for the reservations. Only information that is needed to be visible is the resource and the reservation time because seeing these the user knows what resource and how long they are reserved. 


And one extra that should be fixed when moving to production. 

6. Not using the HTTPS-protocol 
- When running the application anywhere (via Zap or Visual Studio Code) the browser should use the HTTPS-protocol instead of HTTP-protocol to enhance security. 
- I actually found and noticed this already earlier during this course when running the code in Visual Studio Code and especially after using Zap Manual Expoler because the browser got the red note about "ei turvallinen". 
- The application should run on browser using the HTTPS-protocol instead of HTTP. This because the HTTPS offer the secured browsing using the SSL/TLS security protocol. This is the one critical thing that really should be fixed before moving to production because application handles sensitive information. 
