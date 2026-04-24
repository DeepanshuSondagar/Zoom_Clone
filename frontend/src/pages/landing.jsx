import React from 'react';
import '../App.css'
import { Link, useNavigate  } from 'react-router-dom';

export default function Landing(){
    
    const router = useNavigate();

    return(
        <div className="LandingPageContainer">
                <nav> 
                    <div className="nevHeader">
                     <h2>Apna Video Call</h2>
                    </div>
                    <div className="navlist">
                        <p onClick={()=>{
                            router("/url")
                }}> Join as Guest</p>
                        <p onClick={()=>{
                            router("/auth")}}>Register</p>
                        <div onClick={()=>{
                            router("/auth")}}role="button">
                            <p >Login</p>
                        </div>
                    </div>
                </nav>

             <div className="landingMainContainer">
                <div>
                    <h1><span style={{color:"#D97500"}}>Connect</span> with your loved ones</h1>
                    <p>Cover a distance by Apna Video Call</p>
                                        <div role="button" className="cta">
                                            <Link to={"/auth"}>Get Started</Link>
                                        </div>
                </div>
                <div>
                    <img src="/mobile.png" alt="mobilephoto"/>
                </div>
             </div>


        </div>
    )
}