import { useState, useContext, useEffect } from "react";
import api from "../Api.js";
import { UserContext } from "../context/UserContext.js";
import ScreeningPassedModal from "./ScreeningPassedModal.js";
import BookingSuccessfulModal from "./BookingSuccessfulModal.js";
import SeatingChart from "./SeatingChart.js";
import Alert from './AlertModal.js';


const BookTicketsModal = ({ isOpen, onClose, id }) => {
  const { user } = useContext(UserContext);
  const [screening, setScreening] = useState([]);
  const today = new Date();
  const dateOnly = today.toISOString().split('T')[0];
  const [isScreeningPassedModalOpen, setIsScreeningPassedModalOpen] = useState(false);
  const [isMenu1Open, setIsMenu1Open] = useState(false);
  const [isMenu2Open, setIsMenu2Open] = useState(false);
  const [isMenu3Open, setIsMenu3Open] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState(null);
  const [ticketQuantity, setTicketQuantity] = useState(0);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const[fullSeats,setFullSeats]=useState(null);
  const [seatsToMessage, setSeatsToMessage] = useState('');
  const [updated,setUpdated]=useState(false);
  const[myAlert,setMyAlert]=useState(false);
  const[myAlertScreening,setMyAlertScreening]=useState(false);


  const timeSlots = ["13:00", "17:00", "21:00"].map(slot => {
    const [hours, minutes] = slot.split(':');
    const formattedTime = `${hours.padStart(2, '0')}:${minutes}`;
    return formattedTime;
  });


  const toggleDropdown1 = () => {
    setIsMenu1Open(!isMenu1Open);
  };

  const toggleDropdown2 = () => {
    setIsMenu2Open(!isMenu2Open);
  };

  const toggleDropdown3 = () => {
    setIsMenu3Open(!isMenu3Open);
  };

  const getNext7Days = () => {
    const days = [];
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const options = { year: '2-digit', month: '2-digit', day: '2-digit' }
    const formatter = new Intl.DateTimeFormat('en', options);

    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + i);
      const dayOfWeek = weekdays[nextDay.getDay()];
      const date = formatter.format(nextDay);
      days.push({ date, dayOfWeek });
    }
    return days;
  };

  const next7Days = getNext7Days();

  const handleDateClick = (date) => {
    const [month, day, year] = date.split('/');
    const formattedDate = `20${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    setSelectedDate(formattedDate);
    setIsMenu1Open(false);
  };


  const handleTimeClick = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setIsMenu2Open(false);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    try {
      setBookingSuccess(true);
      await bookTickets(screening);
    } catch (err) {
      console.error('Error fetching screening data:', err);
    }
  };

  const handleSelectedSeats = (seats) => {
    let x = 0;
    setSelectedSeats(seats);
    seats.map(() => {
      x++;
      setTicketQuantity(x);
    })

  };

  const bookTickets = async (screening) => {
    const bookingDateTimeString = `${selectedDate}T${selectedTimeSlot}:00`;
    const bookingDateTime = new Date(bookingDateTimeString);

    const currentDateTime = new Date();

    if (selectedDate === currentDateTime.toISOString().split('T')[0] && bookingDateTime < currentDateTime) {
      setIsScreeningPassedModalOpen(true);
      setBookingSuccess(false);
      return;
    }


    const bookingData = {
      user: {
        id: user.id,
      },
      screening: {
        id: screening.id,
      },
      numOfSeats: ticketQuantity,
      createdOn: dateOnly,
      seats: selectedSeats
    };



    const emailData = {
      toEmail: user.email,
      subject: "Booking confirmation for " + screening.movie.title,
      body: `User: ${user.firstname} ${user.lastname}\nMovie: ${screening.movie.title}\nMovieHall: ${screening.movieHall.name}\nNumber of tickets: ${ticketQuantity}\nSeats(row/number): ${seatsToMessage}\nDate: ${screening.date}\nTime: ${screening.time}\nCreated on: ${dateOnly}`
    }

    try {
      const headers = {
        Authorization: `Bearer ${user.token}`,
      };
      const requestData = {
        booking: bookingData,
        emailData: emailData
      };
      const response = await api.post('/api/bookings', requestData, { headers });
      setUpdated(true);

      if (response.status !== 200) {
        setMyAlert(true);
        console.error(`Error booking tickets: ${response.status} ${response.statusText}`);
        return;
      }

    } catch (error) {
      setMyAlert(true);
      console.error('Error booking tickets:', error);
    }
  };

  useEffect(() => {
    if (fullSeats === null) {
      return;
    }
  
    const message = fullSeats.map((seat) => {
      const { seatRow, seatNumber } = seat; 
      return `${seatRow}/${seatNumber}`;
    }).join(', '); 
  
    setSeatsToMessage(message);
  }, [fullSeats]);

  var fs = [];
  useEffect(() => {
    if (selectedSeats === null) {
      return;
    }
    const getSeats = async () => {
      try {
        await Promise.all(selectedSeats.map(async (seatId) => {
          const response = await api.get("/api/seats/" + seatId);
          fs.push(response.data);
        }));
        setFullSeats(fs);
      } catch (err) {
        if (err.response) {
          console.log(err.response.data);
          console.log(err.response.status);
          console.log(err.response.headers);
        } else {
          console.log(`Error: ${err.message}`);
        }
      }
    }
    getSeats();

  }, [selectedSeats])

  useEffect(() => {
    if (selectedDate && selectedTimeSlot) {
      if (isReady) {
        setTimeout(() => {
          setIsReady(false);
        }, 1000)
      } else {
        setTimeout(() => {
          setIsReady(true);
        }, 1000)
      }
    }
  }, [selectedDate, selectedTimeSlot]);

  useEffect(() => {
    if (selectedDate != null && selectedTimeSlot != null) {
      const getScreening = async () => {
        try {
          const response = await api.get(`/api/screenings/${selectedDate}/${selectedTimeSlot}/${id}`);
          setScreening(response.data);
        } catch (err) {
          if (err.response) {
            setMyAlertScreening(true);
            console.log(err.response.data);
            console.log(err.response.status);
            console.log(err.response.headers);
          } else {
            console.log(`Error: ${err.message}`);
          }
        }
      }
      getScreening();
    }
  }, [selectedDate, selectedTimeSlot, isReady])






  if (!isOpen) return null;
  return (
    <div className="modal-custom">
      <div className={`modal-content-custom ${(myAlert || myAlertScreening) ? 'blur-background': ''}`}>
        <div className="header-modal">
          <h2>Book tickets</h2>
          <span className="close" onClick={onClose}>&times;</span>
        </div>

        {/* DROPDOWN 1 */}

        <div className="dropdown">
          <button className="dropdown-toggle button-85 less-padding" onClick={() => toggleDropdown1()}>
            {selectedDate ? selectedDate : "Choose date..."}
          </button>
          {isMenu1Open && (
            <ul className="border-radius-5 dropdown-menu d-block position-static mx-0 border-0 shadow w-220px">
              {next7Days.map(({ date, dayOfWeek }) => (
                <li key={date}>
                  <a className="dropdown-item d-flex gap-2 align-items-center" href="#" onClick={() => handleDateClick(date)}>
                    <span>{dayOfWeek}</span>
                    -
                    <svg className="bi" width="0" height="16"><use xlinkHref="#files"></use></svg>
                    {date}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* DROPDOWN 2 */}

        <div className="dropdown">
          <button className="dropdown-toggle button-85 less-padding" onClick={() => toggleDropdown2()}>
            {selectedTimeSlot ? selectedTimeSlot : "Choose time slot..."}
          </button>
          {isMenu2Open && (
            <ul className="border-radius-5 dropdown-menu d-block position-static mx-0 border-0 shadow w-220px">
              {timeSlots.map((timeSlot, index) => (
                <li className="listItemDropdown" key={index}>
                  <a className="dropdown-item d-flex gap-2 align-items-center" href="#" onClick={() => handleTimeClick(timeSlot)}>
                    <span>{timeSlot}</span>
                  </a>
                </li>
              ))}

            </ul>
          )}
        </div>

        {/* DROPDOWN 3 */}
        <div className="dropdown">
          <button className="dropdown-toggle button-85 less-padding" onClick={() => toggleDropdown3()} disabled={!selectedDate || !selectedTimeSlot}>
            {selectedSeats ? ticketQuantity + " seats selected" : "Choose seats..."}
          </button>
          {isMenu3Open && (
            <SeatingChart screening={screening}
              onSeatsSelected={handleSelectedSeats} />
          )}
        </div>

        {/*SUBMIT BUTTON */}
        <div className="bookTickets">
          <button onClick={handleBooking}>
            Book tickets
          </button>
        </div>

      </div>
      {bookingSuccess && !myAlert && (
        <BookingSuccessfulModal
          isOpen={bookingSuccess} onCloseM={() => setBookingSuccess(false)} onClose={onClose} updated={updated}
        />
      )}
      {isScreeningPassedModalOpen && (
        <ScreeningPassedModal isOpen={isScreeningPassedModalOpen} onClose={() => setIsScreeningPassedModalOpen(false)} />
      )}

      {myAlert && <Alert message={"Sorry, the system could not save the booking."} />}
      {myAlertScreening && <Alert message={"Sorry, the system could not load the screening."} />}
    </div>

  );

}

export default BookTicketsModal;

