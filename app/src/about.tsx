import "./App.css"
import githubUrl from './icons/github.svg';
import linkedinUrl from './icons/linkedin.svg';
import emailUrl from './icons/email.svg';
import { Link } from 'react-router-dom';

function About() {

    return (
        <div className="two-pane">
            <LeftContent />
            <RightContent />
        </div>
    );
}
export default About;

const LeftContent = () => {
    return (
        <aside className="pane left">
            <img
                src="/front_portrait_downscaled.jpg"
                alt="Headshot picture of Nick Tapp-Hughes"
                className="left-portrait"
            />
            <a
                href="https://danielturbertphotography.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="headshot-link"
            >
                <span>Where did you get that awesome headshot?</span>
            </a>

            <Contact />
        </aside>
    )
}

const RightContent = () => {
    return (
        <div className="pane right">
            <h1 className="main-subheading">
                Who I Am
            </h1>
            <p className="main-paragraph">
                I'm a software developer and researcher with 4 years of working experience, specializing in building, evaluating, and deploying AI/ML models, developing full-stack web applications, and big data analytics. My primary goal is to align my expertise with hard problems whose solutions are real-word systems.
            </p>
            <p className="main-paragraph">
                I am the product of a wonderful family, an amazing group of friends, and a series of invaluable teachers and mentors.
            </p>
            <h1 className="main-subheading">
                Solving Problems
            </h1>
            <p className="main-paragraph">
                In my experience, the following methods for solving problems have proven useful:
            </p>
            <ul>
                <li>Searching for similar problems that have been solved</li>
                <li>Organizing information (diagramming, writing a design doc, etc.) to more efficiently hold relevant information mentally</li>
                <li>Deep-diving into the relevant set of tools/technologies to learn how to better use them</li>
                <li>Taking a walk, getting some sleep, or meditating</li>
                <li>Explaining to and discussing with coworkers and leaders (if working in an organization); or friends, family, mentors and peers (if working independently)</li>
                <li>Taking an idea that is known to be rough or incomplete and trying to implement it anyway, in the hopes of better understanding what the right idea is</li>
                <li>Exploring a wider set of tools</li>
                <li>Reconsidering the path that led to the problem at hand</li>
            </ul>
            <p className="main-paragraph">
                After engaging in these problem-solving activities for long enough, the engineer’s brain does something magical: new ideas for improvements, or even a whole solution to the problem, arise! Then comes the implementation, and you have a real-world solution. This process is deeply meaningful to me.
            </p>
            <p className="main-paragraph">
                To see where I developed and applied my problem-solving method, you can view my <Link to="/cv">CV</Link>.
            </p>
            <h1 className="main-subheading">
                What I'm Doing Now
            </h1>
            <p className="main-paragraph">
                In July, I left my role as a software developer at <a href="https://www.epic.com/">Epic</a>. I’m currently traveling in Europe and the US, publishing scientific papers, building this website, writing blog posts, meeting with my mentors, and working on personal projects. Would you like to contact me, for any reason at all? Feel free to reach out.
            </p>
        </div>
    )
}

const Contact = () => {
    return (
        <section id="contact" className="contact-section">

            <h2 className="contact-section__header">Contact</h2>

            <div className="contact-section__item">
                <img src={emailUrl} alt="Email Icon" className="contact-icon" />
                <span className="email-text">
                    nicholas(dot)tapphughes(at)gmail(dot)com
                </span>
            </div>

            <div className="contact-section__item">
                <img src={githubUrl} alt="GitHub" className="contact-icon" />
                <a
                    href="https://github.com/tapphughesn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-section__link"
                >
                    <span>GitHub</span>
                </a>
                <span className="separator">|</span>
                <img src={linkedinUrl} alt="LinkedIn Icon" className="contact-icon" />
                <a
                    href="https://www.linkedin.com/in/nicholas-tapp-hughes-b75641142/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-section__link"
                >
                    <span>LinkedIn</span>
                </a>
            </div>

        </section>
    );
}
