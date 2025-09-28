import "./App.css"
import githubUrl from './icons/github.svg';
import linkedinUrl from './icons/linkedin.svg';
import emailUrl from './icons/email.svg';

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
                I'm a software developer and researcher with 4 years of working experience, specializing in building, experimenting upon and deploying AI/ML models, developing high quality, customer facing full-stack web applications, and big data analytics. I love to use my expertise to work on hard problems whose solutions are real-word systems. I also love to learn from, teach, collaborate with, and generally hang out with great people.
            </p>
            <p className="main-paragraph">
                Outside of work and personal projects, I like to spend time with family, exercise (usually hiking, rock climbing, running, or weight lifting), read, cook interesting dinners, and play poker.
            </p>
            <h1 className="main-subheading">
                How I Solve Problems
            </h1>
            <p className="main-paragraph">
                When I’m working on a project, the most important process looks like this: It all starts with an idea that needs to be investigated and implemented, which usually means I need to solve a hard technical problem. Soon enough, I’ll find myself metaphorically banging my head against the wall, uncertain of how the solution may take shape. At this stage, it could be that I don’t yet know enough about the tools I’m using, I don’t have the mental energy to hold all of the relevant information in my brain at once, I need to explore and expand my knowledge base, or that the problem is so technically complex that it requires deep problem-solving to find a bespoke solution. This is why they call it “work”--it’s usually not very fun to be in this stage of the process. But, after taking a walk, getting some sleep, discussing with my coworkers, trying a few things, and generally thinking about the problem for a while, the neurons in my brain somehow reorganize themselves to deliver that sweet, sublime “a-ha” moment, where the solution is suddenly clear (the sweetness of this moment is proportional to the degree of challenge that was overcome). Then comes the joyful work of transforming the conceptual solution into something that exists in reality. If you complete enough cycles of this process within the context of a larger project, the technical problems in the project either become small enough or nonexistent, and you have a systematic solution that works. Going through the stages of this central process (ideation, iteration, eventual solution, and final realization) is deeply meaningful to me. When I look back at past problems I’ve solved, I think to myself “I’m very glad I did that” and “I’m proud of what I’ve done.”
            </p>
            <p className="main-paragraph">
                This isn’t the only process that must be done to complete a project. In fact, this process usually takes up a small minority share of the overall working time spent on a project, especially if the project is collaborative within a larger organization. Some other processes are also extremely important--for example, gathering feedback from users/customers and incorporating it into a design. However, the process I described above is the most central--it is the most important thing that must be done to complete the project. It’s also the process that grows a software developer the most, enabling them to take on more challenging problems in the future. It’s the secret sauce that gives me the confidence to regularly show up, say “I can do this,” and work on stuff that at first glance might seem impossible.
            </p>
            <h1 className="main-subheading">
                What I'm Doing Now
            </h1>
            <p className="main-paragraph">
                In July, I left my job as a software developer at <a href="https://www.epic.com/">Epic</a>. Until I find my next full time role, I’m traveling around Europe and the US, publishing scientific papers, building this website, writing blog posts, meeting with my mentors, and working on personal projects. Do you have an opportunity that could be a good fit for me? Feel free to reach out.
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
