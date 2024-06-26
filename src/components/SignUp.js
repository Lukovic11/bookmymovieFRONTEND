import { useContext, useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';
import { UserContext } from "../context/UserContext.js";
import api from "../Api.js";
import Alert from '../modals/AlertModal.js';

const SignUp = () => {

  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [triggerEffect, setTriggerEffect] = useState(false);
  const [warning, setWarning] = useState(false);
  const [userExists,setUserExists]=useState(false);
  const [shortPass,setShortPass]=useState(false);
  const[myAlert,setMyAlert]=useState(false);


  const handleSubmit = (e) => {
    e.preventDefault();

    setCurrentUser({
      firstname: firstname,
      lastname: lastname,
      email: email,
      password: password,
      role: "customer"
    });
    setTriggerEffect(true);
  };

  useEffect(() => {
    if (triggerEffect) {
      if (email === '' || password === '' || firstname==='' || lastname==='') {
        setWarning(true);
        return;
      }
      if(password.length<8){
        setShortPass(true);
        return;
      }
      setShortPass(false);
      setWarning(false);
      const getUser = async () => {
        try {
          const existingUser=await api.get("api/users/doesUserExist/"+email);
          if(existingUser.data){
          setUserExists(true);
          return;
          }
          setUserExists(false);
          const response = await api.post("/api/signup", currentUser);

          if (response.status === 200) {
            const headers = {
              Authorization: `Bearer ${response.data.token}`
            };
            const response2 = await api.get("/api/users/byEmail/" + email, { headers });
            if (response2.status === 200) {
              setUser({
                id: response2.data.id,
                firstname: response2.data.firstname,
                lastname: response2.data.lastname,
                email: response2.data.email,
                role:response2.data.role,
                token: response.data.token
              })
              navigate("/");
            }
          }
        } catch (err) {
          if (err.response) {
            setMyAlert(true);
            console.log(err.response.data);
            console.log(err.response.status);
            console.log(err.response.headers);
          } else {
            console.log(`Error: ${err.message}`);
          }
        }
      };
      getUser();
      setTriggerEffect(false);
    }
  }, [triggerEffect, currentUser, setUser, email, navigate]);


  return (
    <div className="sign-up">
      <div className="smaller-height modal modal-sheet position-static d-block" tabIndex="-1" role="dialog" id="modalSignin">
        <div className={`modal-dialog ${myAlert ? 'blur-background': ''}`} role="document">
          <div className="less-padding modal-content rounded-4 shadow">
            <div className="modal-header p-5 pt-4 pb-4 border-bottom-0">
              <h1 className="signuptext fw-bold mb-0 fs-2">Sign up</h1>
            </div>

            <div className=" c p-5 pt-0">
              <form onSubmit={handleSubmit}>
                <div className="form-floating mb-3">
                  <input type="text" className="form-control rounded-3" id="floatingInput" placeholder="John" value={firstname}
                    onChange={(e) => setFirstname(e.target.value)} />
                  <label htmlFor="floatingInput">First name</label>
                </div>
                <div className="form-floating mb-3">
                  <input type="text" className="form-control rounded-3" id="floatingInput" placeholder="Doe" value={lastname}
                    onChange={(e) => setLastname(e.target.value)} />
                  <label htmlFor="floatingInput">Last name</label>
                </div>
                <div className="form-floating mb-3">
                  <input type="email" className="form-control rounded-3" id="floatingInput" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <label htmlFor="floatingInput">Email</label>
                </div>
                <div className="form-floating mb-3">
                  <input type="password" className="form-control rounded-3" id="floatingPassword" placeholder="Password" value={password}
                    onChange={(e) => setPassword(e.target.value)} />
                  <label htmlFor="floatingPassword">Password</label>
                </div>
                <button className="w-100 mb-2 btn btn-lg rounded-3 btn-primary" type="submit">Sign up</button>
                {warning && <p style={{color:"red", marginBottom:"-24px",paddingBottom:0}}>Please fill out all the fields</p>}
                {userExists && !warning && !shortPass && <p style={{color:"red", marginBottom:"-24px",paddingBottom:0}}>There is already a user with this email</p>}
                {shortPass && !warning && <p style={{color:"red", marginBottom:"-24px",paddingBottom:0}}>Password can't be shorter than 8 characters!</p>}
              </form>
            </div>
          </div>
        </div>
              {myAlert && <Alert message={"Sorry, the system could not sign up the user."} />}
      </div>
    </div>
  );
}

export default SignUp;