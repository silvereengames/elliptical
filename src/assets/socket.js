import { io } from "socket.io-client"

export default io(location.port === "5173" ? "localhost:3000" : undefined)
