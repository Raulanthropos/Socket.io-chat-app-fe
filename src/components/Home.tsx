import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  FormControl,
  ListGroup,
} from "react-bootstrap";
import { Message, User } from "../types";
import { io } from "socket.io-client";

// 1. When we jump into this page, the socket.io client needs to connect to the server
// 2. If the connection happens successfully, the server will emit an event called "welcome"
// 3. If we want to do something when that event happens we shall LISTEN to that event by using socket.on("welcome")
// 4. Once we are connected we want to submit the username to the server --> we shall EMIT an event called "setUsername" (containing the username itself as payload)
// 5. The server is listening for the "setUsername" event, when that event is fired the server will broadcast that username to whoever is listening for an event called "loggedIn"
// 6. If a client wants to display the list of online users, it should listen for the "loggedIn" event
// 7. In this way the list of online users is updated only during login, but what happens if a new user joins? In this case we are not updating the list
// 8. When a new user joins server emits another event called "updateOnlineUsersList", this is supposed to update the list when somebody joins or leaves. Clients they should listen for the "updateOnlineUsersList" event to update the list when somebody joins or leaves
// 9. When the client sends a message we should trigger a "sendMessage" event
// 10. Server listens for that and then it should broadcast that message to everybody but the sender by emitting an event called "newMessage"
// 11. Anybody who is listening for a "newMessage" event will display that in the chat

const socket = io("http://localhost:3001", { transports: ["websocket"] });
// if you don't specify the transport ("websocket") socket.io will try to connect to the server by using Polling (old technique)

const Home = () => {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  useEffect(() => {
    socket.on("welcome", (welcomeMessage) => {
      console.log(welcomeMessage);

      socket.on("loggedIn", (onlineUsersList) => {
        console.log("logged in event:", onlineUsersList);
        setLoggedIn(true);
        setOnlineUsers(onlineUsersList);
      });

      socket.on("updateOnlineUsersList", (onlineUsersList) => {
        console.log("A new user connected/disconnected");
        setOnlineUsers(onlineUsersList);
      });

      socket.on("newMessage", (newMessage) => {
        console.log(newMessage);
        setChatHistory([...chatHistory, newMessage.message]);
      });
    });
  });

  const submitUsername = () => {
    // here we will be emitting a "setUsername" event (the server is already listening for that)
    socket.emit("setUsername", { username });
  };

  const sendMessage = () => {
    const newMessage: Message = {
      sender: username,
      text: message,
      createdAt: new Date().toLocaleString("el-gr"),
    };
    socket.emit("sendMessage", { message: newMessage });
    setChatHistory([...chatHistory, newMessage]);
  };

  return (
    <Container fluid>
      <Row style={{ height: "95vh" }} className="my-3">
        <Col md={9} className="d-flex flex-column justify-content-between">
          {/* LEFT COLUMN */}
          {/* TOP AREA: USERNAME INPUT FIELD */}
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              submitUsername();
            }}
          >
            <FormControl
              placeholder="Set your username here, and press 'Enter' to login!"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loggedIn}
            />
          </Form>
          {/* )} */}
          {/* MIDDLE AREA: CHAT HISTORY */}
          <ListGroup>
            {chatHistory.map((message, index) => (
              <ListGroup.Item style={{ color: "blue" }} key={index}>
                {<strong>{message.sender}</strong>} | {message.text} at{" "}
                {message.createdAt}
              </ListGroup.Item>
            ))}
          </ListGroup>
          {/* BOTTOM AREA: NEW MESSAGE */}
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <FormControl
              placeholder="Write your message here"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!loggedIn}
            />
          </Form>
        </Col>
        <Col md={3}>
          {/* ONLINE USERS SECTION */}
          <div className="mb-3">Connected users:</div>
          {onlineUsers.length === 0 ? (
            <ListGroup.Item style={{ background: "red", color: "whitesmoke" }}>
              Log in to check who is online!!
            </ListGroup.Item>
          ) : (
            <ListGroup>
              {onlineUsers.map((user) => (
                <ListGroup.Item
                  style={{ background: "lightgray", color: "green" }}
                  key={user.socketId}
                >
                  {user.username}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
