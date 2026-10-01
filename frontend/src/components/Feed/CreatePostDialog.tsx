import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Dialog, DialogBackdrop, DialogPanel, DialogTitle, Label } from '@headlessui/react'
import { ChevronDownIcon, X } from 'lucide-react';
import Avator from './Avator';
import { useState } from 'react';


const people = [
  { id: 1, name: 'Leslie Alexander' },
]

type CreatePostDialogProps = {
    open: boolean | undefined;
    setOpen: ()=>{};
}
const CreatePostDialog = ({open=false, setOpen} : CreatePostDialogProps) => {
  const [query, setQuery] = useState('')
  const [selectedPerson, setSelectedPerson] = useState(null)

  const filteredPeople =
    query === ''
      ? people
      : people.filter((person) => {
          return person.name.toLowerCase().includes(query.toLowerCase())
        })
  return (
    <div>
      <Dialog open={open} onClose={setOpen} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
            <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600"
                >
                  <span className="sr-only">Close</span>
                  <X aria-hidden="true" className="size-6" />
                </button>
            </div>
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <div className='flex gap-2 items-center'>
                    <Avator />
                    <div>
                    <h5 className='text-md font-semibold'>Owner Name</h5>
                    <div>
                        <Combobox
                            as="div"
                            value={selectedPerson}
                            onChange={(person) => {
                                setQuery('')
                                setSelectedPerson(person)
                            }}
                            >
                            <Label className="block text-sm/6 font-medium text-gray-900">Assigned to</Label>
                            <div className="relative mt-2">
                                <ComboboxInput
                                className="block w-full rounded-md bg-white py-1.5 pr-12 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                onChange={(event) => setQuery(event.target.value)}
                                onBlur={() => setQuery('')}
                                displayValue={(person) => person?.name}
                                />
                                <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden">
                                <ChevronDownIcon className="size-5 text-gray-400" aria-hidden="true" />
                                </ComboboxButton>

                                <ComboboxOptions
                                transition
                                className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline outline-black/5 data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
                                >
                                {query.length > 0 && (
                                    <ComboboxOption
                                    value={{ id: null, name: query }}
                                    className="cursor-default px-3 py-2 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden"
                                    >
                                    {query}
                                    </ComboboxOption>
                                )}
                                {filteredPeople.map((person) => (
                                    <ComboboxOption
                                    key={person.id}
                                    value={person}
                                    className="cursor-default px-3 py-2 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden"
                                    >
                                    <span className="block truncate">{person.name}</span>
                                    </ComboboxOption>
                                ))}
                                </ComboboxOptions>
                            </div>
                            </Combobox>
                    </div>
                    </div>
                </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to deactivate your account? All of your data will be permanently removed
                      from our servers forever. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 sm:ml-3 sm:w-auto"
                >
                  Post
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default CreatePostDialog