import { reactive } from 'vue';

export const context = reactive({
    input: '',
    username: localStorage.getItem('username') || '',
    messages: [],
    rooms: [],
    roomid: null,
    online: 0,
    delete: false,
    highlight: false,
    adminpass: '',
    command: '',
    status: {
        code: 1,
        text: 'Connecting'
    },
    notif: {
        showing: false,
        status: 0,
        text: '',
        id: ''
    }
});