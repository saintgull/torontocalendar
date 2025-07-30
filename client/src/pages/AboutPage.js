import React from 'react';
import { Link } from 'react-router-dom';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        <h1 className="about-title">About</h1>
        
        <div className="about-content">
          <p>
            This calendar was inspired by <a href="https://chrisdcalendars.notion.site/Toronto-Event-Calendar-a6a970ba10aa461fa3846a9c996ecf49" target="_blank" rel="noopener noreferrer">ChrisD's Toronto Events Calendar</a> and a desire to host it on a more memorable url, 
            as well as giving other super-connectors/event organizers the ability to contribute and add their own events.
          </p>
          
          <p>
            I purposefully have not opened sign ups, as I believe this calendar is best stewarded by a small team of people 
            for curation purposes. Invites can be requested by contacting me (Erin Saint Gull) on Twitter or any other 
            platforms if we know each other! Especially if you're someone who knows about a lot of events and are vaguely 
            in-group (Friendly Ambitious Nerds, TPOT, techbros and meditators…).
          </p>
          
          <p>
            Many special thanks to the Toronto event organizers of many kinds. Thank you for making this city so vibrant :)
          </p>
          
          <h2>Other Toronto Event Resources</h2>
          <p>Here are a few calendars and resources from other event aggregators, that I will cross-post as much as I can:</p>
          
          <ul className="resource-list">
            <li>
              <a href="https://www.makeworld.space/garden/Toronto%20Events.html" target="_blank" rel="noopener noreferrer">
                makeworld.space/garden/Toronto Events
              </a>
              <span className="resource-description">
                A repository of event aggregators as well as a calendar of its own; also has location and group 
                recommendations which I endorse
              </span>
            </li>
            
            <li>
              <a href="https://torontoeventgenerator.substack.com/" target="_blank" rel="noopener noreferrer">
                Toronto Event Generator
              </a>
              <span className="resource-description">
                The Toronto Event Generator newsletter run by Toronto's best super-connector and events guy, Misha Glouberman
              </span>
            </li>
            
            <li>
              <a href="https://notes.justagwailo.com/toronto/events" target="_blank" rel="noopener noreferrer">
                Richard Eriksson's Guide
              </a>
              <span className="resource-description">
                Richard Eriksson's guide on finding events in Toronto (he is also vice-president of Tech Pizza Mondays 
                which is where to find him the easiest ;) )
              </span>
            </li>
            
            <li>
              <a href="https://showuptoronto.ca/" target="_blank" rel="noopener noreferrer">
                Show Up Toronto
              </a>
              <span className="resource-description">
                Political organization and mutual aid events calendar. I purposefully do not include events from this 
                calendar, as they kind of have their own thing going on and I would like this event aggregator to be 
                more cultural/social focused, but worth checking out!
              </span>
            </li>
            
            <li>
              <a href="https://weavetoronto.notion.site/" target="_blank" rel="noopener noreferrer">
                Weave Toronto
              </a>
              <span className="resource-description">
                An improvised college campus in Toronto with courses, events, and a focus on community. In my view, 
                this is the most interesting thing happening this summer/fall here and I highly advise checking it out
              </span>
            </li>
          </ul>
          
          <p>
            And, of course, attending the events on this event aggregator calendar will increase your luck and 
            serendipity surface area, which in turn will lead you to find more events. It's a win-win!
          </p>
          
          <p className="signature">
            Have fun,<br/>
            <br/>
            Erin
          </p>
        </div>
        
        <div className="about-footer">
          <Link to="/" className="back-link">← Back to Calendar</Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;