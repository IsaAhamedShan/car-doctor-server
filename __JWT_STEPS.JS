/***
 * install jsonwebtoken
 * install cookie-parser so we can get cookies from any where from the application
 * make a post request using '/jwt' and send email from client site as the data.
 * make a token using jwt.sign(payload,token,{expiresIn:"timestamp"})
 * add cors(origin:['http://localhost/5173'],credentials: true) as our client site address is different from the server site address
 * send cookie to client site using 
 * res.cookie('token',token,{
 * httpOnly: true,
 * secure: true,
 * sameSite:'none'})
 */
/***
 * WHERE to store the token
 * 1. memory
 * 2. local storage (xss)
 * 3. cookies: http only(better)we have to use cookie parser(npm install cookie-parser)
 */
/***

 * set the cookies with http only. for development we have to use sercure:false
 * cors setting
 * client side axios settings
 *cookies has a policy that it works on same domain (mane client and server address same hoya lage. ei jonno amader cors({origin:['http://localhost:5173'], credentials:true )}) set kora lage

 *
 in axios set withCredential:true
 */

 /*** VERIFY THE TOKEN
  * to verify token we can make a middleware and pass that middleware when a client is trying to get some data.
  * middle ware can access the req of the user. so the jwt.verify function can be used to verify the token.
  * jwt.verify(token,secret,(error,decode)=>{
  * error fucntion will be called for error.
  * decode fucntion will be called for successful decode and for that we will set 
  * req.user = decode and call
  * next()
  * 
  * }) where we can get the token from req.cookies?.token
  * 
  * 
  */