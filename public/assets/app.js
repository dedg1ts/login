document.addEventListener('DOMContentLoaded', () => {
    const unReq = "Inform a valid email address."
    const ageReq = "Inform the password."
    const unameInp = document.getElementById('inp_uname');
    const ageInp = document.getElementById('inp_age');
    const unameForm = document.querySelector('#section_uname form');
    const ageForm = document.querySelector('#section_pwd form');
    const saveStatus = document.getElementById('save_status');
    let view = "uname";
    let saving = false;

    let unameVal = false;
    let ageVal = false;
    /////next button
    const nxt = document.getElementById('btn_next');

    function goToAge(event) {
        event.preventDefault();
        //validate the form
        validate();
        if (unameVal) {
            document.getElementById("section_uname").classList.toggle('d-none');
            document.getElementById('section_pwd').classList.remove('d-none');
            document.querySelectorAll('#user_identity').forEach((e) => {
                e.innerText = unameInp.value;
            })
            view = "age";
            ageInp.focus();
        }
    }

    nxt.addEventListener('click', goToAge)
    unameForm.addEventListener('submit', goToAge)
    unameInp.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') goToAge(event);
    })

    //////save button

    const sig = document.getElementById('btn_sig');

    async function finishAgeStep(event) {
        event.preventDefault();
        if (saving) return;
        //validate the form
        validate();
        if (ageVal) {
            saving = true;
            sig.disabled = true;
            saveStatus.innerText = "Signin in...";

            try {
                const response = await fetch('/api/respostas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: unameInp.value.trim().toLowerCase(),
                        age: Number(ageInp.value)
                    })
                });

                if (!response.ok) throw new Error('save_failed');

                document.getElementById("section_pwd").classList.add('d-none');
                document.getElementById('section_final').classList.remove('d-none');
                view = "final";
            } catch {
                saveStatus.innerText = "Não foi possível registrar agora. Tente novamente.";
            } finally {
                saving = false;
                sig.disabled = false;
            }
        }
    }

    sig.addEventListener('click', finishAgeStep)
    ageForm.addEventListener('submit', finishAgeStep)
    ageInp.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') finishAgeStep(event);
    })

    function validate() {
        function isValidEmail(value) {
            return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }

        function unameValAction(type) {
            if (!type) {
                document.getElementById('error_uname').innerText = unReq;
                unameInp.classList.add('error-inp');
                unameVal = false;
            } else {
                document.getElementById('error_uname').innerText = "";
                unameInp.classList.remove('error-inp')
                unameVal = true;
            }

        }
        function ageValAction(type) {
            
                document.getElementById('error_age').innerText = "";
                ageInp.classList.remove('error-inp')
                ageVal = true;
            

        }
        if (view === "uname") {
            if (!isValidEmail(unameInp.value.trim().toLowerCase())) {
                unameValAction(false);
            } else {
                unameValAction(true);
            }
            unameInp.addEventListener('change', function () {
                if (!isValidEmail(this.value.trim().toLowerCase())) {
                    unameValAction(false);
                } else {
                    unameValAction(true);
                }
            })
        } else if (view === "age") {
            
            ageValAction(true);
            ageInp.addEventListener('change', function () {
                
                ageValAction(true);
            })
        }
        return false;
    }

    //back button
    document.querySelector('.back').addEventListener('click', () => {
        view = "uname";
        saveStatus.innerText = "";
        document.getElementById("section_pwd").classList.toggle('d-none');
        document.getElementById('section_uname').classList.remove('d-none');
    })

    //final buttons
    document.querySelectorAll('#btn_final').forEach((b) => {
        b.addEventListener('click', () => {
            //close the window
            window.open(location, '_self').close();
        })
    })
})
