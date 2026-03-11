import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NoteField } from './note-field'

describe('NoteField', () => {
  it('renders a textarea', () => {
    render(<NoteField value="" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('displays the value prop', () => {
    render(<NoteField value="hello world" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toHaveValue('hello world')
  })

  it('calls onChange with new value on input', () => {
    const onChange = vi.fn()
    render(<NoteField value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new text' } })
    expect(onChange).toHaveBeenCalledWith('new text')
  })

  it('has maxLength attribute of 500', () => {
    render(<NoteField value="" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '500')
  })

  it('has placeholder text "..."', () => {
    render(<NoteField value="" onChange={() => {}} />)
    expect(screen.getByPlaceholderText('...')).toBeInTheDocument()
  })
})
