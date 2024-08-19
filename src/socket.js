import { io } from "socket.io-client"

export default io(location.port === "5174" ? "localhost:3000" : undefined)
