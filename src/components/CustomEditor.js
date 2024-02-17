import React, { useEffect, useRef, useState } from 'react';
import { Editor, EditorState, RichUtils, Modifier, getDefaultKeyBinding, convertToRaw, convertFromRaw } from 'draft-js';
import "../index.css";

const colorStyleMap = {
    red: {
        color: 'rgba(255, 0, 0, 1.0)',
    },
}

function CustomEditor() {
    const [editorState, setEditorState] = useState(() => {
        const savedContent = localStorage.getItem('editorContent');
        if (savedContent) {
            const contentState = convertFromRaw(JSON.parse(savedContent));
            return EditorState.createWithContent(contentState);
        }
        return EditorState.createEmpty();
    });

    const editor = useRef(null);

    const focusEditor = () => {
        editor.current.focus();
    }

    useEffect(() => {
        focusEditor()
    }, []);

    const onChange = (newEditorState) => {
        setEditorState(newEditorState);
    };

    const handleKeyCommand = (command, editorState) => {
        const applyStyle = (styleType, offset) => {
            const contentState = editorState.getCurrentContent();
            const selectionState = editorState.getSelection();

            const endOffset = selectionState.getEndOffset();

            const newContent = Modifier.replaceText(
                contentState,
                selectionState.merge({ anchorOffset: endOffset - offset, focusOffset: endOffset }),
                '',
                null,
                null
            );

            const newEditorState = EditorState.push(
                editorState,
                newContent,
                'remove-range',
            );

            onChange(styleType === 'header-one' ? RichUtils.toggleBlockType(newEditorState, styleType) : RichUtils.toggleInlineStyle(newEditorState, styleType));
            return 'handled';
        };

        switch (command) {
            case 'heading-one':
                return applyStyle('header-one', 1);
            case 'bold':
                return applyStyle('BOLD', 1);
            case 'red':
                return applyStyle('red', 2);
            case 'underline':
                return applyStyle('UNDERLINE', 3);
            default:
                return 'not-handled';
        }
    };

    const keyBindingFn = (e) => {
        const { key, keyCode } = e;

        if (key === ' ' && keyCode === 32) {
            const contentState = editorState.getCurrentContent();
            const selectionState = editorState.getSelection();
            const currentBlock = contentState.getBlockForKey(selectionState.getStartKey());
            const blockText = currentBlock.getText();

            if (blockText === '#') {
                return 'heading-one';
            }
            if (blockText === '*') {
                return 'bold';
            }
            if (blockText === '**') {
                return 'red';
            }
            if (blockText === '***') {
                return 'underline';
            }
        }
        return getDefaultKeyBinding(e);
    };

    const handleReturn = (event, editorState) => {
        const contentState = editorState.getCurrentContent();
        const selection = editorState.getSelection();

        const newContentState = Modifier.splitBlock(contentState, selection);

        const newContentStateWithUnstyled = Modifier.setBlockType(
            newContentState,
            newContentState.getSelectionAfter(),
            'unstyled'
        );

        const emptyInlineStyleOverride = editorState.getCurrentInlineStyle().clear();
        const newEditorState = EditorState.setInlineStyleOverride(editorState, emptyInlineStyleOverride);

        const newEditorStateWithRemovedStyles = EditorState.push(
            newEditorState,
            newContentStateWithUnstyled,
            'split-block'
        );

        onChange(newEditorStateWithRemovedStyles);

        return 'handled';
    }

    const handleSubmit = () => {
        const contentState = editorState.getCurrentContent();
        const contentRaw = convertToRaw(contentState);
        const contentString = JSON.stringify(contentRaw);
        console.log(contentString);
        localStorage.setItem('editorContent', contentString);
        alert('Content saved!');
    }

    const handleRefresh = () => {
        localStorage.removeItem('editorContent');
        setEditorState(EditorState.createEmpty());
    }

    return (
        <>
            <div className="editor-wrapper" onClick={focusEditor}>
                <div className="editor-container">
                    <Editor
                        placeholder="Type Here"
                        ref={editor}
                        customStyleMap={colorStyleMap}
                        editorState={editorState}
                        onChange={onChange}
                        handleKeyCommand={handleKeyCommand}
                        keyBindingFn={keyBindingFn}
                        handleReturn={handleReturn}
                    />
                </div>
            </div>
            <div className='button-container'>
                <button onClick={handleSubmit}>Submit</button>
                <button onClick={handleRefresh}>Refresh</button>
            </div>
        </>
    );
}

export default CustomEditor;
