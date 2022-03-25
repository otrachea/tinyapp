# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly). This project was made as a exercise in learning express and web servers, thus it is NOT READY FOR PRODUCTION or largescale usage.

## Final Product

!["Screenshot of register page"](https://github.com/otrachea/tinyapp/blob/master/docs/register-page.png)
!["Sceenshot of page that shows all of the user's URLs"](https://github.com/otrachea/tinyapp/blob/master/docs/my-urls-page.png)
!["screenshot of page that shows each URL"](https://github.com/otrachea/tinyapp/blob/master/docs/urls-show-page.png)

## Dependencies
https://github.com/otrachea/tinyapp/blob/master/docs/urls-show-page.png
- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session


## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.
- Once server is running, you MUST make an account in order to use most of the functionality

## Creating a new URL
To create a new url, first visit the registration page. (Most of the website is blocked if you try and access it without being logged in). Then head to the "Create New URL" page and paste the full URL of the URL you want to shorten. You will then be redirected to a page that shows various info and the ability to edit your new short URL as well as the number of visitors, unique visitors and timestamp for each visit. 

## Known Issues
- If you are logged in to an account then restart the server, you'll get an error since on reset the server wipes all known URLs and users from the database. The fix is to logout **before** restarting the server and then refresh the page then no errors will occur.
