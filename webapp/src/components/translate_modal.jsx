import React, {useState, useEffect, useRef} from 'react';
import {FormGroup, FormControl, Button} from 'react-bootstrap';

const LANGUAGES = [
    {code: 'vi', name: 'Vietnamese'},
    {code: 'en', name: 'English'},
    {code: 'ja', name: 'Japanese'},
    {code: 'fr', name: 'French'},
    {code: 'de', name: 'German'},
    {code: 'zh', name: 'Chinese'},
    {code: 'ko', name: 'Korean'},
];

const TranslateModal = () => {
    const [show, setShow] = useState(false);
    const [postId, setPostId] = useState('');
    const [targetLang, setTargetLang] = useState(localStorage.getItem('mm_translate_preferred_lang') || 'vi');
    const [isTranslating, setIsTranslating] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [translation, setTranslation] = useState('');
    const popupRef = useRef(null);

    useEffect(() => {
        const handleOpenEvent = (event) => {
            const {postId, error, autoTranslate} = event.detail;
            setPostId(postId);
            setErrorMsg(error || '');
            setTranslation('');
            setShow(true);

            if (autoTranslate) {
                setTimeout(() => handleTranslate(postId, targetLang), 0);
            }
        };

        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                onHide();
            }
        };

        window.addEventListener('open-translate-modal', handleOpenEvent);
        document.addEventListener('mousedown', handleClickOutside);
        
        return () => {
            window.removeEventListener('open-translate-modal', handleOpenEvent);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [targetLang]);

    const onHide = () => {
        if (!isTranslating) {
            setShow(false);
            setErrorMsg('');
            setTranslation('');
        }
    };

    const handleTranslate = async (currentPostId = postId, currentLang = targetLang) => {
        setIsTranslating(true);
        setErrorMsg('');
        setTranslation('');
        try {
            const getCookie = (name) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop().split(';').shift();
            };
            const csrfToken = getCookie('MMCSRF');

            const response = await fetch('/plugins/com.mattermost.message-translate/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-Csrf-Token': csrfToken,
                },
                body: JSON.stringify({
                    post_id: currentPostId,
                    target_lang: currentLang,
                }),
            });

            if (response.status === 401) {
                throw new Error('Session expired.');
            }

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Failed to call translation API');
            }

            const data = await response.json();
            setTranslation(data.translation);
            localStorage.setItem('mm_translate_preferred_lang', currentLang);
        } catch (error) {
            console.error('Translation error:', error);
            setErrorMsg(error.message);
        } finally {
            setIsTranslating(false);
        }
    };

    const getLanguageName = (code) => {
        const lang = LANGUAGES.find((l) => l.code === code);
        return lang ? lang.name : code;
    };

    if (!show) {
        return null;
    }

    const modalTitle = (
        <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
            <span>{'🌍'}</span>
            <span>{translation ? `Translation - ${getLanguageName(targetLang)}` : 'Translate'}</span>
        </div>
    );

    return (
        <div 
            ref={popupRef}
            style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10000,
                borderRadius: '12px', 
                overflow: 'hidden', 
                width: '320px', 
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                border: '1px solid #ddd',
                backgroundColor: 'white'
            }}
        >
            <div style={{padding: '12px 16px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: translation || isTranslating ? '8px' : '0'}}>
                    <div style={{fontSize: '13px', fontWeight: '600', color: '#3d3c40'}}>
                        {modalTitle}
                    </div>
                    {!isTranslating && (
                        <button
                            onClick={onHide}
                            style={{
                                border: 'none',
                                background: 'none',
                                fontSize: '18px',
                                lineHeight: '1',
                                color: '#999',
                                cursor: 'pointer',
                                padding: '0 0 4px 10px'
                            }}
                        >
                            {'×'}
                        </button>
                    )}
                </div>

                {errorMsg && (
                    <div className='alert alert-danger' style={{padding: '6px 10px', marginBottom: '10px', fontSize: '11px', borderRadius: '8px'}}>
                        {errorMsg}
                    </div>
                )}

                {!translation && !isTranslating && (
                    <FormGroup controlId='targetLanguageSelect' style={{marginBottom: '5px', marginTop: '5px'}}>
                        <FormControl
                            componentClass='select'
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                            disabled={isTranslating}
                            style={{borderRadius: '6px', height: '32px', fontSize: '12px', padding: '4px 8px'}}
                        >
                            {LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                            ))}
                        </FormControl>
                        <div style={{textAlign: 'right', marginTop: '10px'}}>
                            <Button
                                bsStyle='primary'
                                onClick={() => handleTranslate()}
                                disabled={isTranslating}
                                style={{borderRadius: '6px', padding: '4px 12px', fontWeight: '600', fontSize: '12px'}}
                            >
                                {'Translate'}
                            </Button>
                        </div>
                    </FormGroup>
                )}

                {isTranslating && (
                    <div style={{textAlign: 'center', padding: '10px 0'}}>
                        <i className='fa fa-spinner fa-pulse' style={{fontSize: '16px', color: '#166de0'}} />
                        <span style={{marginLeft: '8px', fontSize: '12px', color: '#666'}}>{'Translating...'}</span>
                    </div>
                )}

                {translation && (
                    <div style={{
                        whiteSpace: 'pre-wrap', 
                        backgroundColor: '#f9f9f9', 
                        padding: '10px 12px', 
                        borderRadius: '8px',
                        fontSize: '13px',
                        lineHeight: '1.4',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        border: '1px solid #f0f0f0',
                        color: '#3d3c40'
                    }}>
                        {translation}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TranslateModal;
