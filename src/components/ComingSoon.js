import { useEffect } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../Api.js"
import Alert from '../modals/AlertModal.js';


const ComingSoon = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const[myAlert,setMyAlert]=useState(false);

  useEffect(() => {
    setTimeout(() => {
      const getMovies = async () => {
        try {
          const response = await api.get("/api/movies");
          const allMovies = response.data;
          setMovies(allMovies.filter(movie => movie.isPlaying === false));
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
      }
      getMovies();
      setLoading(false);
    }, 1000)
  }, [])


  return (
    <div className="screenings">
      <h1>Coming soon</h1>
      <div className='not-found'></div>
      {loading ? <div className="loader"> </div> : <div>
        <div className="movie-list">
          {movies.map((movie) => (
            <div className="movie-item" key={movie.id} >
              <div className="flex">
                {movie.poster && <img src={movie.poster} alt={movie.title} />}
                <Link to={`/movies/${movie.id}`}>
                  <button className='button-85'>Details</button>
                </Link>
              </div>
              <div className="movie-details">
                <Link to={`/movies/${movie.id}`}>
                  <h2>{movie.title}</h2>
                  <p>{movie.genre} | {movie.duration} min</p>
                </Link>
              </div>
            </div>
          ))

          }
        </div>
      </div>}
      {myAlert && <Alert message={"Sorry, the system could not load the movies."} />}
    </div>
  );
}

export default ComingSoon;