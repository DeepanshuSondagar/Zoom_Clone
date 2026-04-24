import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contents/AuthContext'
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
  import CardContent from '@mui/material/CardContent';
 import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';

import { IconButton } from '@mui/material';
export default function History() {


    const { getHistoryOfUser } = useContext(AuthContext);

    const [meetings, setMeetings] = useState([])
    const [fetchError, setFetchError] = useState(null)


    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await getHistoryOfUser();
                console.log('getHistoryOfUser response:', data);
                console.log('local token:', localStorage.getItem('token'));
                const list = Array.isArray(data) ? data : (data?.data || []);
                setMeetings(list);
                setFetchError(null);
            } catch (err) {
                console.error('fetchHistory error:', err);
                setFetchError(err?.message || String(err));
            }
        }

        fetchHistory();
    }, [getHistoryOfUser])

    let formatDate = (dateString) => {

        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear();

        return `${day}/${month}/${year}`

    }

    return (
        <div>

            <IconButton onClick={() => {
                routeTo("/home")
            }}>
                <HomeIcon />
            </IconButton >
            {
                fetchError ? (
                    <Typography color="error">Error loading history: {fetchError}</Typography>
                ) : (meetings.length !== 0) ? meetings.map((e, i) => {
                    return (

                        <>


                            <Card key={i} variant="outlined">


                                <CardContent>
                                    <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                        Code: {e.meetingCode}
                                    </Typography>

                                    <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                        Date: {formatDate(e.date)}
                                    </Typography>

                                </CardContent>


                            </Card>


                        </>
                    )
                }) : <Typography sx={{ color: 'text.secondary' }}>No history available.</Typography>

            }

        </div>
    )
}